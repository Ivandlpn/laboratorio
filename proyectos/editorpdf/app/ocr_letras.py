"""Pieza 3: reconoce letras que en el PDF son dibujo y las devuelve como texto.

Usa el reconocimiento de letras que ya trae Windows (es-ES); no instala ningun programa.
No toca ni borra nada: devuelve los textos reconocidos y cuales trazados del PDF son esas letras.

Dos pasadas:
 1. Trazados de linea (las letras de AutoCAD suelen ser UN trazo por cada texto): cada uno se
    dibuja solo, ampliado, y se reconoce por separado. Si el texto va vertical se prueba girado.
 2. Letras de contorno (formas rellenas chicas y oscuras): se dibujan todas juntas en una imagen
    de la pagina y se reconoce la pagina; lo que no se reconoce se prueba girado 90 grados.
"""
import asyncio
import re
from collections import Counter

import cv2
import fitz
import numpy as np
from PIL import ImageFont

MM_POR_PT = 25.4 / 72.0
PX_POR_MM_PAGINA = 14.0
ALTO_MIN_MM, ALTO_MAX_MM, ANCHO_MAX_MM, LINEA_MAX_MM = 0.15, 8.0, 8.0, 250.0
LUMINOSIDAD_MAX = 0.75
CON_COLA = set("gjpqyQ,;()[]")
FUENTE = r"C:/Windows/Fonts/arial.ttf"
PERMITIDOS = set(".,:;-()/+%=º°·'\"ñÑ&#<>")


def disponible():
    try:
        from winrt.windows.globalization import Language
        from winrt.windows.media.ocr import OcrEngine
        return OcrEngine.is_language_supported(Language("es-ES"))
    except Exception:
        return False


def _luminosidad(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


def _valido(texto):
    t = texto.replace(" ", "")
    if not t or not re.search(r"[A-Za-zÁÉÍÓÚÑáéíóúñ0-9]", t):
        return False
    if any(not (c.isalnum() or c in PERMITIDOS) for c in t):
        return False
    if len(t) <= 2 and t.islower():
        return False
    return True


async def _reconocer_imagen(motor, png):
    from winrt.windows.graphics.imaging import BitmapDecoder
    from winrt.windows.storage.streams import DataWriter, InMemoryRandomAccessStream
    flujo = InMemoryRandomAccessStream()
    w = DataWriter(flujo)
    w.write_bytes(png)
    await w.store_async()
    w.detach_stream()
    flujo.seek(0)
    dec = await BitmapDecoder.create_async(flujo)
    bmp = await dec.get_software_bitmap_async()
    res = await motor.recognize_async(bmp)
    lineas = []
    for ln in res.lines:
        pal = [(p.text, p.bounding_rect.x, p.bounding_rect.y, p.bounding_rect.width, p.bounding_rect.height) for p in ln.words]
        if pal:
            lineas.append({"texto": ln.text, "palabras": pal})
    return lineas


def _motor():
    from winrt.windows.globalization import Language
    from winrt.windows.media.ocr import OcrEngine
    return OcrEngine.try_create_from_language(Language("es-ES"))


def _pts_mm(pagina, sub):
    rot = pagina.rotation_matrix
    out = []
    for p in sub:
        q = fitz.Point(p[0], p[1]) * rot
        out.append((q.x * MM_POR_PT, q.y * MM_POR_PT))
    return out


def _ancho_natural(texto, cap_mm):
    try:
        return ImageFont.truetype(FUENTE, 100).getlength(texto) / 100 * (cap_mm / 0.716)
    except Exception:
        return 0


def _texto_de_caja(texto, x0, y0, x1, y1, angulo, color, glifos):
    """Pone el texto dentro de la caja (mm, y hacia abajo). angulo 0, 90 (sube) o -90 (baja)."""
    if angulo == 0:
        largo, alto = x1 - x0, y1 - y0
    else:
        largo, alto = y1 - y0, x1 - x0
    cola = any(c in CON_COLA for c in texto)
    cap = alto * (0.76 if cola else 1.0)
    natural = _ancho_natural(texto, cap)
    factor = max(0.5, min(1.5, largo / natural)) if natural > 0 else 1.0
    if angulo == 0:
        x, y = x0, y0 + cap
    elif angulo == 90:
        x, y = x0 + cap, y1
    else:
        x, y = x1 - cap, y0
    return {"texto": texto, "x_mm": x, "y_mm": y, "alto_mm": cap, "angulo": float(angulo),
            "color": color, "ancho": round(factor, 3), "glifos": glifos}


GROSORES = (0.04, 0.07, 0.11)  # grosor del trazo al dibujar, como fraccion del alto de la caja
CONFUSION_DIGITO = {"O": "0", "Q": "0", "D": "0", "I": "1", "L": "1", "l": "1", "|": "1", "Z": "2", "S": "5", "B": "8", "G": "6"}


def corregir_codigo(texto):
    """Arregla confusiones tipicas en codigos cortos de dos letras y dos cifras (CFOL, DMO1, cF03...)."""
    m = re.fullmatch(r"([A-Za-z]{2})([0-9OQDILlZSBG|]{2})", texto.strip())
    if m and (any(c.isdigit() for c in m.group(2)) or m.group(1).upper() in ("CF", "DM", "MD")):
        return m.group(1).upper() + "".join(CONFUSION_DIGITO.get(c, c) for c in m.group(2))
    return texto


def limpiar_texto(texto):
    """Pule errores tipicos del reconocimiento: 20crn -> 20cm, pÁGlNA -> PÁGINA, RKl -> RK1."""
    t = re.sub(r"(?<=\d)(c?)rn\b", r"\1m", texto)
    partes = re.split(r"(\s+)", t)
    for k, tok in enumerate(partes):
        if re.fullmatch(r"[A-Z]{2}l", tok):
            partes[k] = tok[:2] + "1"
            continue
        letras = [c for c in tok if c.isalpha()]
        if len(letras) >= 3 and sum(c.isupper() for c in letras) / len(letras) >= 0.5:
            tok = re.sub(r"(?<=[A-ZÁÉÍÓÚÑ])l|l(?=[A-ZÁÉÍÓÚÑ])|^l(?=[A-ZÁÉÍÓÚÑ])", "I", tok)  # l suelta dentro de mayusculas
            tok = "".join(c.upper() if c.isalpha() else c for c in tok) if sum(c.isupper() for c in letras) / len(letras) >= 0.6 else tok
        if re.fullmatch(r"[A-Z]{2}l", tok):
            tok = tok[:2] + "1"
        partes[k] = tok
    return corregir_codigo("".join(partes))


def _es_basura(texto):
    """Rayitas o puntos del dibujo que el reconocedor lee como 'o', '0' o 'e' repetidas."""
    chars = re.sub(r"[^A-Za-z0-9]", "", texto).lower()
    return bool(chars) and set(chars) <= set("o0e") and len(chars) >= 2


def _pequenos(pagina, dibujos):
    """Indices y cajas (mm) de los dibujos chicos y oscuros que pueden ser parte de un texto."""
    filas = []
    for i, d in enumerate(dibujos):
        tipo = d.get("type", "")
        col = d.get("color") if tipo == "s" else d.get("fill")
        if not col or (tipo == "s" and d.get("fill")) or _luminosidad(col) > LUMINOSIDAD_MAX:
            continue
        r = d["rect"] * pagina.rotation_matrix
        if r.width * MM_POR_PT > ANCHO_MAX_MM or r.height * MM_POR_PT > ALTO_MAX_MM:
            continue
        filas.append((i, r.x0 * MM_POR_PT, r.y0 * MM_POR_PT, r.x1 * MM_POR_PT, r.y1 * MM_POR_PT))
    return np.array(filas, dtype=np.float64) if filas else np.zeros((0, 5))


def _tiene_marco(pagina, d, subtrazados, x0, y0, x1, y1):
    """Una etiqueta (como CF04) trae un rectangulo cerrado del tamano de toda la caja."""
    for sub in subtrazados(d["items"]):
        if len(sub) >= 4 and abs(sub[0][0] - sub[-1][0]) < 1e-2 and abs(sub[0][1] - sub[-1][1]) < 1e-2:
            pts = _pts_mm(pagina, sub)
            xs, ys = [q[0] for q in pts], [q[1] for q in pts]
            if abs(min(xs) - x0) < 0.2 and abs(max(xs) - x1) < 0.2 and abs(min(ys) - y0) < 0.2 and abs(max(ys) - y1) < 0.2:
                return True
    return False


def _pasada_trazos(pagina, dibujos, subtrazados, motor, textos, cubiertos):
    """Cada trazado de linea chico (un texto entero) se reconoce por separado, junto con los
    trazos sueltos que caen dentro de su caja (por ejemplo la cifra de CF04, dibujada aparte)."""
    cand = []
    for i, d in enumerate(dibujos):
        if not (d.get("color") and not d.get("fill") and d.get("type") == "s"):
            continue
        if len(d["items"]) < 6 or _luminosidad(d["color"]) > LUMINOSIDAD_MAX:
            continue
        r = d["rect"] * pagina.rotation_matrix
        w, h = r.width * MM_POR_PT, r.height * MM_POR_PT
        menor, mayor = min(w, h), max(w, h)
        if not (0.4 <= menor <= ALTO_MAX_MM and mayor <= LINEA_MAX_MM and mayor >= 1.5):
            continue
        cand.append((i, r.x0 * MM_POR_PT, r.y0 * MM_POR_PT, r.x1 * MM_POR_PT, r.y1 * MM_POR_PT, w, h))
    cand.sort(key=lambda c: -(c[5] * c[6]))  # primero las cajas grandes: absorben a las chicas
    peq = _pequenos(pagina, dibujos)
    absorbidos = set()

    def pintar(img, i, x0, y0, pad, esc, grosor):
        d = dibujos[i]
        subs = [np.round(np.array([[(px - x0 + pad) * esc, (py - y0 + pad) * esc] for px, py in _pts_mm(pagina, s)], np.float32)).astype(np.int32)
                for s in subtrazados(d["items"])]
        if d.get("type") == "s":
            cv2.polylines(img, subs, False, 0, grosor, lineType=cv2.LINE_AA)
        else:
            cv2.fillPoly(img, [q for q in subs if len(q) >= 3], 0)

    async def correr():
        for i, x0, y0, x1, y1, w, h in cand:
            if i in absorbidos:
                continue
            miembros = [i]
            if len(peq) and _tiene_marco(pagina, dibujos[i], subtrazados, x0, y0, x1, y1):
                m = 0.4
                cx, cy = (peq[:, 1] + peq[:, 3]) / 2, (peq[:, 2] + peq[:, 4]) / 2
                dentro = (cx >= x0 - m) & (cx <= x1 + m) & (cy >= y0 - m) & (cy <= y1 + m)
                miembros += [int(k) for k in peq[dentro, 0] if int(k) != i]
            vertical = h > w * 1.5
            esc = min(40.0, max(12.0, 60.0 / min(w, h)))
            pad = 2.0
            ancho_px, alto_px = int((w + 2 * pad) * esc), int((h + 2 * pad) * esc)
            if max(ancho_px, alto_px) > 9000:
                continue
            votos = {}
            for kg in GROSORES:
                img = np.full((alto_px, ancho_px), 255, np.uint8)
                for k in miembros:
                    pintar(img, k, x0, y0, pad, esc, max(2, int(kg * min(w, h) * esc)))
                intentos = [(0, img)]
                if vertical:
                    intentos = [(90, np.rot90(img, k=-1).copy()), (-90, np.rot90(img, k=1).copy())]
                for ang, im in intentos:
                    ok, png = cv2.imencode(".png", im)
                    lineas = [l for l in await _reconocer_imagen(motor, png.tobytes()) if _valido(l["texto"])]
                    if lineas:
                        clave = (ang, " | ".join(l["texto"].strip() for l in lineas))
                        votos.setdefault(clave, []).append(lineas)
            if not votos:
                continue
            clave = max(votos, key=lambda c: (len(votos[c]), sum(ch.isalnum() for ch in c[1])))
            ang, lineas = clave[0], votos[clave][0]
            for ln in lineas:  # una linea reconocida = un texto, con la caja que da el propio reconocedor
                bu0 = min(p[1] for p in ln["palabras"])
                bu1 = max(p[1] + p[3] for p in ln["palabras"])
                bv0 = min(p[2] for p in ln["palabras"])
                bv1 = max(p[2] + p[4] for p in ln["palabras"])
                xs, ys = [], []
                for u, v in ((bu0, bv0), (bu1, bv0), (bu0, bv1), (bu1, bv1)):
                    if ang == 0:
                        px, py = u, v
                    elif ang == 90:
                        px, py = v, alto_px - u
                    else:
                        px, py = ancho_px - v, u
                    xs.append(x0 - pad + px / esc)
                    ys.append(y0 - pad + py / esc)
                texto = limpiar_texto(ln["texto"].strip())
                if _es_basura(texto) or ((max(xs) - min(xs) if ang == 0 else max(ys) - min(ys)) > 0 and min(max(xs) - min(xs), max(ys) - min(ys)) < 0.7 and len(texto) < 8):
                    continue
                textos.append(_texto_de_caja(texto, min(xs), min(ys), max(xs), max(ys), ang,
                                             tuple(dibujos[i]["color"]), len(miembros)))
            cubiertos.update(miembros)
            absorbidos.update(miembros)

    asyncio.run(correr())
    return len(cand)


def _pasada_contornos(pagina, dibujos, subtrazados, motor, textos, cubiertos):
    """Letras de contorno: formas rellenas chicas y oscuras, reconocidas con toda la pagina a la vez."""
    k = MM_POR_PT * PX_POR_MM_PAGINA
    ancho, alto = int(round(pagina.rect.width * k)), int(round(pagina.rect.height * k))
    glifos = []
    for i, d in enumerate(dibujos):
        if i in cubiertos or not d.get("fill") or d.get("color") or "f" not in d.get("type", ""):
            continue
        r = d["rect"] * pagina.rotation_matrix
        w, h = r.width * MM_POR_PT, r.height * MM_POR_PT
        if not (w <= ANCHO_MAX_MM and h <= ALTO_MAX_MM and max(w, h) >= ALTO_MIN_MM):
            continue
        if _luminosidad(d["fill"]) > LUMINOSIDAD_MAX:
            continue
        subs = [np.array([[x * PX_POR_MM_PAGINA, y * PX_POR_MM_PAGINA] for x, y in _pts_mm(pagina, s)], np.float32)
                for s in subtrazados(d["items"]) if len(s) >= 3]
        if subs:
            glifos.append({"i": i, "subs": subs, "caja": (r.x0 * k, r.y0 * k, r.x1 * k, r.y1 * k), "color": tuple(d["fill"])})
    pendientes = list(glifos)

    async def correr():
        nonlocal pendientes
        for giro in (0, -1, 1):
            if not pendientes:
                break
            base = np.full((alto, ancho), 255, np.uint8)
            for g in pendientes:
                cv2.fillPoly(base, [np.round(s).astype(np.int32) for s in g["subs"]], 0)
            img = base if giro == 0 else np.rot90(base, k=-1 if giro == -1 else 1).copy()
            ok, png = cv2.imencode(".png", img)
            lineas = await _reconocer_imagen(motor, png.tobytes())
            usados = set()
            for ln in lineas:
                if not _valido(ln["texto"]):
                    continue
                u0 = min(p[1] for p in ln["palabras"]) - 2
                u1 = max(p[1] + p[3] for p in ln["palabras"]) + 2
                v0 = min(p[2] for p in ln["palabras"]) - 2
                v1 = max(p[2] + p[4] for p in ln["palabras"]) + 2
                propios = []
                for j, g in enumerate(pendientes):
                    if j in usados:
                        continue
                    cx, cy = (g["caja"][0] + g["caja"][2]) / 2, (g["caja"][1] + g["caja"][3]) / 2
                    cu, cv_ = (cx, cy) if giro == 0 else ((alto - cy, cx) if giro == -1 else (cy, ancho - cx))
                    if u0 <= cu <= u1 and v0 <= cv_ <= v1:
                        propios.append(j)
                if not propios:
                    continue
                x0 = min(pendientes[j]["caja"][0] for j in propios) / PX_POR_MM_PAGINA
                y0 = min(pendientes[j]["caja"][1] for j in propios) / PX_POR_MM_PAGINA
                x1 = max(pendientes[j]["caja"][2] for j in propios) / PX_POR_MM_PAGINA
                y1 = max(pendientes[j]["caja"][3] for j in propios) / PX_POR_MM_PAGINA
                color = Counter(pendientes[j]["color"] for j in propios).most_common(1)[0][0]
                texto = limpiar_texto(ln["texto"].strip())
                if not _es_basura(texto):
                    textos.append(_texto_de_caja(texto, x0, y0, x1, y1, {0: 0, -1: 90, 1: -90}[giro], color, len(propios)))
                usados.update(propios)
            for j in usados:
                cubiertos.add(pendientes[j]["i"])
            pendientes = [g for j, g in enumerate(pendientes) if j not in usados]

    asyncio.run(correr())
    return len(glifos)


def reconocer(pagina, dibujos, subtrazados):
    """Devuelve {'textos': [...], 'cubiertos': {indices de dibujo}, 'probados': n, 'motivo': str}.

    Los textos traen x_mm, y_mm (punto de base, y hacia abajo), alto_mm, angulo, color, ancho.
    """
    if not disponible():
        return {"textos": [], "cubiertos": set(), "probados": 0,
                "motivo": "El reconocimiento de letras de Windows (es-ES) no esta disponible en esta computadora."}
    motor = _motor()
    textos, cubiertos = [], set()
    n1 = _pasada_trazos(pagina, dibujos, subtrazados, motor, textos, cubiertos)
    n2 = _pasada_contornos(pagina, dibujos, subtrazados, motor, textos, cubiertos)
    # un mismo texto dibujado dos veces en el mismo sitio (p. ej. el cajetin) se escribe una sola vez
    vistos, unicos = set(), []
    for t in textos:
        clave = (t["texto"], round(t["x_mm"] / 0.5), round(t["y_mm"] / 0.5))
        if clave not in vistos:
            vistos.add(clave)
            unicos.append(t)
    return {"textos": unicos, "cubiertos": cubiertos, "probados": n1 + n2, "motivo": ""}
