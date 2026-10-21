"""Pieza 1: convierte un PDF vectorial de planos a DXF (R2004) con capas.

Uso:  python pdf_a_dxf.py entrada.pdf [carpeta_salida]
Escribe un DXF por pagina: <nombre>_p<N>.dxf y devuelve un resumen por pagina.
"""
import re
import sys
from collections import Counter
from pathlib import Path

import ezdxf
import fitz  # PyMuPDF

PT_A_MM = 25.4 / 72.0
CAPA_SIN_NOMBRE = "SIN_CAPA_PDF"
CAPA_TEXTO = "Textos"
CAPA_TEXTO_OCR = "Texto_reconocido_REVISAR"
GROSORES_DXF = [0, 5, 9, 13, 15, 18, 20, 25, 30, 35, 40, 50, 53, 60, 70, 80,
                90, 100, 106, 120, 140, 158, 200, 211]
BEZIER_PASOS = 8


def nombre_capa(nombre):
    """DXF no admite < > / \\ " : ; ? * | = ` en nombres de capa."""
    if not nombre:
        return CAPA_SIN_NOMBRE
    return re.sub(r'[<>/\\":;?*|=`]', "_", nombre).strip() or CAPA_SIN_NOMBRE


def color_rgb(c):
    if not c:
        return None
    return tuple(max(0, min(255, round(v * 255))) for v in c[:3])


def grosor_dxf(ancho_pt):
    centesimas = (ancho_pt or 0) * PT_A_MM * 100
    return min(GROSORES_DXF, key=lambda g: abs(g - centesimas))


def bezier(p1, p2, p3, p4):
    puntos = []
    for i in range(1, BEZIER_PASOS + 1):
        t = i / BEZIER_PASOS
        u = 1 - t
        x = u**3 * p1.x + 3 * u * u * t * p2.x + 3 * u * t * t * p3.x + t**3 * p4.x
        y = u**3 * p1.y + 3 * u * u * t * p2.y + 3 * u * t * t * p3.y + t**3 * p4.y
        puntos.append((x, y))
    return puntos


def subtrazados(items):
    """Parte los items de un trazado en listas de puntos contiguos (en pt, y hacia abajo)."""
    subs, actual, fin = [], [], None
    for it in items:
        tipo = it[0]
        if tipo == "l":
            a, b = it[1], it[2]
            pts = [(a.x, a.y), (b.x, b.y)]
        elif tipo == "c":
            a = it[1]
            pts = [(a.x, a.y)] + bezier(it[1], it[2], it[3], it[4])
        elif tipo == "re":
            if len(actual) > 1:  # no perder la polilinea pendiente antes del rectangulo
                subs.append(actual)
            r = it[1]
            subs.append([(r.x0, r.y0), (r.x1, r.y0), (r.x1, r.y1), (r.x0, r.y1), (r.x0, r.y0)])
            actual, fin = [], None
            continue
        elif tipo == "qu":
            if len(actual) > 1:
                subs.append(actual)
            q = it[1]
            subs.append([(q.ul.x, q.ul.y), (q.ur.x, q.ur.y), (q.lr.x, q.lr.y), (q.ll.x, q.ll.y), (q.ul.x, q.ul.y)])
            actual, fin = [], None
            continue
        else:
            continue
        if actual and fin is not None and abs(fin[0] - pts[0][0]) < 1e-3 and abs(fin[1] - pts[0][1]) < 1e-3:
            actual.extend(pts[1:])
        else:
            if len(actual) > 1:
                subs.append(actual)
            actual = list(pts)
        fin = pts[-1]
    if len(actual) > 1:
        subs.append(actual)
    return subs


# --- Texto: el plano de AutoCAD guarda algunos textos con el indice de glifo en vez de la letra ---
def _decodificar_glifos(s):
    """Indice de glifo de Arial: 3..97 -> ASCII 32..126 (codigo + 29); desde 98, MacRoman (codigo + 30)."""
    salida = []
    for ch in s:
        g = ord(ch)
        if 3 <= g <= 97:
            salida.append(chr(g + 29))
        elif 98 <= g <= 225:
            try:
                salida.append(bytes([g + 30]).decode("mac_roman"))
            except UnicodeDecodeError:
                salida.append("?")
        else:
            salida.append(ch)
    return "".join(salida)


def _parece_espanol(s):
    letras = [c for c in s if c.isalpha()]
    if not letras:
        return 0.0
    vocales = sum(1 for c in letras if c.lower() in "aeiouáéíóúü")
    raros = sum(1 for c in s if ord(c) < 32 or c in "()\\{}^_`~")
    return vocales / len(letras) - 0.3 * raros / max(1, len(s))


def texto_legible(s):
    """Devuelve (texto, fue_corregido).

    Un texto con indices de glifo trae caracteres de control (el espacio es ) o,
    si es una sola palabra, no trae ninguna vocal y al decodificarlo si las trae.
    """
    candidato = _decodificar_glifos(s)
    if any(ord(c) < 32 for c in s):
        return candidato, True
    sin_vocales = not any(c.lower() in "aeiouáéíóú" for c in s)
    letras = [c for c in candidato if c.isalpha()]
    vocales = sum(1 for c in letras if c.lower() in "aeiouáéíóúü")
    if sin_vocales and letras and vocales / len(letras) >= 0.3 and candidato.isprintable():
        return candidato, True
    return s, False


def capas_por_orden(pdf, pagina):
    """Capa (OCG) de cada operacion de pintura, en el mismo orden que get_drawings().

    PyMuPDF deja pegada una capa en 'layer' tras cerrar el bloque, asi que se lee el
    contenido de la pagina. Devuelve None si no se puede (el conteo no coincide).
    """
    ocgs = pdf.get_ocgs()
    if not ocgs:
        return None
    recursos = pdf.xref_get_key(pagina.xref, "Resources")[1]
    props = {m.group(1): int(m.group(2)) for m in re.finditer(r"/(\w+)\s+(\d+)\s+0\s+R", recursos.split("/Properties", 1)[-1])}
    contenidos = pagina.get_contents()
    contenidos = [contenidos] if isinstance(contenidos, int) else list(contenidos)
    datos = b"\n".join(pdf.xref_stream(x) for x in contenidos)
    datos = re.sub(rb"\((?:\\.|[^\\()])*\)", b"()", datos)  # fuera cadenas de texto
    capas, pila = [], []
    for m in re.finditer(rb"/OC\s*/(\w+)\s*BDC|(?<![\w/])EMC(?![\w])|(?<![\w/.\-])(?:S|s|f|F|f\*|B|B\*|b|b\*)(?![\w*])", datos):
        t = m.group(0)
        if t.endswith(b"BDC"):
            xref = props.get(m.group(1).decode())
            pila.append(ocgs.get(xref, {}).get("name", "") if xref else "")
        elif t == b"EMC":
            if pila:
                pila.pop()
        else:
            capas.append(pila[-1] if pila else "")
    return capas


def nueva_hoja():
    """Documento DXF vacio (R2004: guarda color RGB). Sirve para juntar varias paginas en un archivo."""
    doc = ezdxf.new("R2004", setup=True)
    doc.units = ezdxf.units.MM
    return doc


def etiquetar(doc, texto, x_mm, y_mm, alto_mm=6.0):
    """Rotulo de pagina para los archivos unidos (capa propia, se puede apagar)."""
    if "Etiquetas_paginas" not in doc.layers:
        doc.layers.add("Etiquetas_paginas", color=5)
    doc.modelspace().add_text(texto, height=alto_mm, dxfattribs={"layer": "Etiquetas_paginas", "insert": (x_mm, y_mm)})


def convertir_pagina(pagina, ruta_dxf, pdf=None, reconocer_texto=False, doc=None, desplazamiento=(0.0, 0.0)):
    alto = pagina.rect.height
    rot = pagina.rotation_matrix  # PyMuPDF entrega trazos y textos sin aplicar /Rotate de la pagina

    dx, dy = desplazamiento

    def xy(p):
        q = fitz.Point(p[0], p[1]) * rot
        return (round(q.x * PT_A_MM + dx, 3), round((alto - q.y) * PT_A_MM + dy, 3))

    propio = doc is None
    if propio:
        doc = nueva_hoja()
    msp = doc.modelspace()
    capas = Counter()
    n = Counter()
    sin_continuo = 0

    dibujos = pagina.get_drawings()
    ocr = None
    if reconocer_texto and not pagina.get_text("words"):  # solo si las letras son dibujo
        import ocr_letras
        ocr = ocr_letras.reconocer(pagina, dibujos, subtrazados)
    por_orden = capas_por_orden(pdf, pagina) if pdf is not None else None
    capas_fiables = por_orden is not None and len(por_orden) == len(dibujos)
    for i, d in enumerate(dibujos):
        capa = nombre_capa(por_orden[i] if capas_fiables else d.get("layer"))
        if capa not in doc.layers:
            doc.layers.add(capa)
        tipo = d.get("type", "s")
        subs = subtrazados(d["items"])
        if not subs:
            continue
        dash = d.get("dashes")
        if dash not in (None, "[] 0"):
            sin_continuo += 1

        if "f" in tipo and d.get("fill"):
            rgb = color_rgb(d["fill"])
            validos = [s for s in subs if len(s) >= 3]
            if validos:  # un relleno sin area no se escribe: quedaria un HATCH vacio
                hatch = msp.add_hatch(dxfattribs={"layer": capa, "true_color": ezdxf.colors.rgb2int(rgb)})
                hatch.set_solid_fill(color=7, rgb=ezdxf.colors.RGB(*rgb))
                for s in validos:
                    hatch.paths.add_polyline_path([xy(p) for p in s], is_closed=True)
                n["rellenos"] += 1
            else:
                n["rellenos_sin_area_omitidos"] += 1

        if "s" in tipo and d.get("color"):
            rgb = color_rgb(d["color"])
            atributos = {"layer": capa, "true_color": ezdxf.colors.rgb2int(rgb),
                         "lineweight": grosor_dxf(d.get("width"))}
            for s in subs:
                cerrado = len(s) > 2 and abs(s[0][0] - s[-1][0]) < 1e-3 and abs(s[0][1] - s[-1][1]) < 1e-3
                pts = [xy(p) for p in (s[:-1] if cerrado else s)]
                if len(pts) < 2:
                    continue
                if len(pts) == 2 and not cerrado:
                    msp.add_line(pts[0], pts[1], dxfattribs=atributos)
                    n["lineas"] += 1
                else:
                    msp.add_lwpolyline(pts, close=cerrado, dxfattribs=atributos)
                    n["polilineas"] += 1
            capas[capa] += 1
        elif "f" in tipo:
            capas[capa] += 1

    # Texto real del PDF
    if CAPA_TEXTO not in doc.layers:
        doc.layers.add(CAPA_TEXTO)
    for b in pagina.get_text("dict")["blocks"]:
        if b["type"] != 0:
            continue
        for linea in b["lines"]:
            dx0, dy0 = linea["dir"]
            dx, dy = dx0 * rot.a + dy0 * rot.c, dx0 * rot.b + dy0 * rot.d
            angulo = round(__import__("math").degrees(__import__("math").atan2(-dy, dx)), 2)
            for sp in linea["spans"]:
                texto, corregido = texto_legible(sp["text"])
                if not texto.strip():
                    continue
                rgb = color_rgb([((sp["color"] >> 16) & 255) / 255, ((sp["color"] >> 8) & 255) / 255, (sp["color"] & 255) / 255])
                altura = round(sp["size"] * PT_A_MM * 0.72, 3)
                t = msp.add_text(texto, height=altura, dxfattribs={
                    "layer": CAPA_TEXTO, "rotation": angulo,
                    "true_color": ezdxf.colors.rgb2int(rgb), "insert": xy(sp["origin"])})
                n["textos"] += 1
                if corregido:
                    n["textos_corregidos"] += 1

    if ocr:
        ancho_mm = pagina.rect.width * PT_A_MM
        alto_mm = pagina.rect.height * PT_A_MM
        if ocr["textos"] and CAPA_TEXTO_OCR not in doc.layers:
            doc.layers.add(CAPA_TEXTO_OCR)
        for t in ocr["textos"]:
            rgb = color_rgb(t["color"])
            msp.add_text(t["texto"], height=round(t["alto_mm"], 3), dxfattribs={
                "layer": CAPA_TEXTO_OCR, "rotation": t["angulo"], "width": t["ancho"],
                "true_color": ezdxf.colors.rgb2int(rgb),
                "insert": (round(t["x_mm"] + dx, 3), round(alto_mm - t["y_mm"] + dy, 3))})
            n["textos_reconocidos"] += 1
    if propio:
        doc.saveas(ruta_dxf)
    return {"ancho_mm": pagina.rect.width * PT_A_MM, "alto_mm": pagina.rect.height * PT_A_MM,
            "capas": dict(capas), "conteo": dict(n), "trazados_no_continuos": sin_continuo,
            "capas_leidas_del_contenido": capas_fiables,
            "ocr_motivo": (ocr or {}).get("motivo", "")}


def convertir_pdf(ruta_pdf, carpeta_salida, reconocer_texto=False):
    ruta_pdf, carpeta_salida = Path(ruta_pdf), Path(carpeta_salida)
    carpeta_salida.mkdir(parents=True, exist_ok=True)
    resumen = []
    pdf = fitz.open(str(ruta_pdf))
    for i, pagina in enumerate(pdf, start=1):
        destino = carpeta_salida / f"{ruta_pdf.stem}_p{i}.dxf"
        r = convertir_pagina(pagina, destino, pdf, reconocer_texto)
        r["archivo"] = destino.name
        r["pagina"] = i
        resumen.append(r)
    return resumen


if __name__ == "__main__":
    pdf_in = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].startswith("--") else str(Path(pdf_in).parent / "salida_pieza1")
    for r in convertir_pdf(pdf_in, out, "--ocr" in sys.argv):
        print(r)
