"""Motor de la pieza 4: junta pdf_a_dxf (pieza 1) y dxf_a_dwg (pieza 2) para la pantalla.

No dibuja nada en pantalla; la pantalla (app.py) solo llama a analizar() y convertir().
"""
import shutil
import tempfile
from pathlib import Path

import fitz

import dxf_a_dwg
import pdf_a_dxf

VERSIONES_DWG = {
    "AutoCAD 2018 o posterior": "ACAD2018",
    "AutoCAD 2013": "ACAD2013",
    "AutoCAD 2010": "ACAD2010",
    "AutoCAD 2007": "ACAD2007",
    "AutoCAD 2004": "ACAD2004",
    "AutoCAD 2000": "ACAD2000",
}
SEPARACION_MM = 60.0  # hueco entre paginas en un archivo unido
LIMITE_ENTIDADES = 450_000  # por archivo unido: pasado esto se parte (cada entidad cuesta unos 2 KB de memoria al armarlo)


class Cancelado(Exception):
    """El usuario pulso Cancelar; no se guarda nada."""


def miniatura(ruta_pdf, numero, ancho=380):
    """Imagen reducida de una pagina: (ancho, alto, bytes RGB)."""
    with fitz.open(str(ruta_pdf)) as pdf:
        p = pdf[numero - 1]
        z = ancho / p.rect.width
        pix = p.get_pixmap(matrix=fitz.Matrix(z, z), alpha=False)
        return pix.width, pix.height, pix.samples


def analizar(ruta_pdf):
    """Una fila por pagina: tamano, si trae texto real y si parece escaneada (imagen)."""
    paginas = []
    with fitz.open(str(ruta_pdf)) as pdf:
        for i, p in enumerate(pdf, start=1):
            palabras = len(p.get_text("words"))
            imagenes = len(p.get_images())
            escaneada = False
            if imagenes:
                escaneada = len(p.get_cdrawings()) < 200
            paginas.append({
                "pagina": i,
                "ancho_mm": round(p.rect.width * 25.4 / 72),
                "alto_mm": round(p.rect.height * 25.4 / 72),
                "palabras": palabras,
                "escaneada": escaneada,
            })
    return paginas


def columnas_por_defecto(n_paginas):
    """Cuadricula casi cuadrada: 1 a 4 paginas en fila, mas de eso en 4 o 5 columnas."""
    return max(1, min(n_paginas, 4 if n_paginas <= 16 else 5))


def nombres_salida(ruta_pdf, paginas, hacer_dxf, hacer_dwg, unir=False, destino=None):
    """Archivos que se van a crear (para avisar antes de reemplazar y para mostrarlos al usuario)."""
    ruta_pdf = Path(ruta_pdf)
    carpeta = Path(destino) if destino else ruta_pdf.parent
    bases = [f"{ruta_pdf.stem}_unido"] if unir else [f"{ruta_pdf.stem}_p{n}" for n in paginas]
    nombres = []
    for base in bases:
        if hacer_dxf:
            nombres.append(carpeta / f"{base}.dxf")
        if hacer_dwg:
            nombres.append(carpeta / f"{base}.dwg")
    return nombres


def existentes(ruta_pdf, paginas, hacer_dxf, hacer_dwg, unir=False, destino=None):
    """Archivos que ya existen y se reemplazarian (en modo unido tambien las partes _unido_1, _unido_2...)."""
    encontrados = [p for p in nombres_salida(ruta_pdf, paginas, hacer_dxf, hacer_dwg, unir, destino) if p.exists()]
    if unir:
        carpeta = Path(destino) if destino else Path(ruta_pdf).parent
        for patron, activo in ((f"{Path(ruta_pdf).stem}_unido_*.dxf", hacer_dxf), (f"{Path(ruta_pdf).stem}_unido_*.dwg", hacer_dwg)):
            if activo:
                encontrados += [p for p in carpeta.glob(patron) if p not in encontrados]
    return encontrados


def convertir(ruta_pdf, paginas, hacer_dxf, hacer_dwg, version_dwg, progreso, reconocer_texto=False,
              cancelado=lambda: False, unir=False, columnas=None, etiquetar=True, destino=None):
    """Convierte las paginas elegidas. progreso(texto, fraccion 0 a 1).

    unir=True junta todas en un solo DXF/DWG, una pagina junto a otra en cuadricula.
    Los archivos se hacen en una carpeta temporal y solo al final se copian al destino,
    asi que un fallo a medias no deja archivos a medio escribir.
    """
    ruta_pdf = Path(ruta_pdf)
    carpeta = Path(destino) if destino else ruta_pdf.parent
    carpeta.mkdir(parents=True, exist_ok=True)
    info = {a["pagina"]: a for a in analizar(ruta_pdf)}
    resultados = []
    util = [n for n in paginas if not info[n]["escaneada"]]
    omitidas = [n for n in paginas if info[n]["escaneada"]]
    total = len(util) + (1 if hacer_dwg and util else 0) + 1
    hecho = 0
    cols = columnas or columnas_por_defecto(len(util))
    base_unida = f"{ruta_pdf.stem}_unido"

    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        dxf_dir, dwg_dir = tmp / "dxf", tmp / "dwg"
        dxf_dir.mkdir()
        doc = pdf_a_dxf.nueva_hoja() if unir else None
        partes = []          # nombres temporales de cada archivo unido
        k_parte = 0          # posicion de la pagina dentro de su parte
        if unir and util:
            ancho_celda = max(info[n]["ancho_mm"] for n in util) + SEPARACION_MM
            alto_celda = max(info[n]["alto_mm"] for n in util) + SEPARACION_MM

        def cerrar_parte():
            nonlocal doc, k_parte
            nombre = f"_parte{len(partes) + 1}"
            progreso("Guardando el archivo unido (con muchas páginas puede tardar)...", hecho / total)
            doc.saveas(dxf_dir / f"{nombre}.dxf")
            partes.append(nombre)
            doc, k_parte = pdf_a_dxf.nueva_hoja(), 0

        with fitz.open(str(ruta_pdf)) as pdf:
            for k, n in enumerate(util):
                if cancelado():
                    raise Cancelado()
                progreso(f"Convirtiendo la página {n} ({k + 1} de {len(util)}); en planos grandes tarda un rato...", hecho / total)
                if unir:
                    if k_parte and len(doc.modelspace()) >= LIMITE_ENTIDADES:
                        cerrar_parte()  # archivo lleno: se sigue en otro
                    dx, dy = (k_parte % cols) * ancho_celda, -(k_parte // cols) * alto_celda
                    r = pdf_a_dxf.convertir_pagina(pdf[n - 1], None, pdf, reconocer_texto, doc=doc, desplazamiento=(dx, dy))
                    if etiquetar:
                        pdf_a_dxf.etiquetar(doc, f"Página {n}", dx, dy + r["alto_mm"] + 6)
                    r["parte"] = len(partes) + 1
                    k_parte += 1
                else:
                    destino_dxf = dxf_dir / f"{ruta_pdf.stem}_p{n}.dxf"
                    r = pdf_a_dxf.convertir_pagina(pdf[n - 1], destino_dxf, pdf, reconocer_texto)
                r["pagina"] = n
                r["palabras_en_pdf"] = info[n]["palabras"]
                resultados.append(r)
                hecho += 1
        if unir and util:
            cerrar_parte()
            doc = None
            bases = {}
            if len(partes) == 1:
                bases[1] = base_unida
            else:
                bases = {i + 1: f"{base_unida}_{i + 1}" for i in range(len(partes))}
            for i, nombre in enumerate(partes, start=1):
                (dxf_dir / f"{nombre}.dxf").rename(dxf_dir / f"{bases[i]}.dxf")
            for r in resultados:
                r["base_unida"] = bases[r["parte"]]
        if cancelado():
            raise Cancelado()
        if hacer_dwg and util:
            progreso("Creando los archivos DWG...", hecho / total)
            dwg = dxf_a_dwg.dxf_a_dwg(dxf_dir, dwg_dir, version_dwg)
            for a in dwg["archivos"]:
                for r in resultados:
                    if (unir and a["dxf"] == f"{r['base_unida']}.dxf") or (not unir and a["dxf"] == f"{ruta_pdf.stem}_p{r['pagina']}.dxf"):
                        r["dwg_creado"] = a["creado"]
                        r["dwg_avisos"] = a["avisos"]
            hecho += 1
        progreso("Guardando en la carpeta elegida...", hecho / total)
        for r in resultados:
            base = r["base_unida"] if unir else f"{ruta_pdf.stem}_p{r['pagina']}"
            r["archivos"] = []
            if hacer_dxf:
                shutil.copy2(dxf_dir / f"{base}.dxf", carpeta / f"{base}.dxf")
                r["archivos"].append(f"{base}.dxf")
            if hacer_dwg and r.get("dwg_creado"):
                shutil.copy2(dwg_dir / f"{base}.dwg", carpeta / f"{base}.dwg")
                r["archivos"].append(f"{base}.dwg")
    progreso("Listo", 1.0)
    return {"resultados": resultados, "omitidas": omitidas, "unido": unir and bool(util), "columnas": cols, "partes": len(partes),
            "carpeta": str(carpeta)}


def resumen_texto(ruta_pdf, salida):
    """Resumen en palabras simples de lo recuperado y lo no recuperado."""
    lineas = [f"Archivo: {Path(ruta_pdf).name}", ""]
    if salida.get("unido"):
        nombres = sorted({a for r in salida["resultados"] for a in r["archivos"]})
        titulo = "todas las páginas en un solo archivo" if salida.get("partes", 1) <= 1 else f"todas las páginas en {salida['partes']} archivos unidos"
        lineas.append(f"Guardado ({titulo}): {', '.join(nombres) or 'nada'}")
        lineas.append(f"  Las {len(salida['resultados'])} páginas van una junto a otra, en cuadrícula de {salida['columnas']} columna(s). "
                      "Cada una trae su rótulo «Página N» en la capa Etiquetas_paginas, que puedes apagar.")
        if salida.get("partes", 1) > 1:
            lineas.append(f"Aviso: se hicieron {salida['partes']} archivos unidos y no uno solo, porque uno solo habría quedado demasiado pesado "
                          "(más de 450.000 elementos) y no cabría en la memoria de muchas computadoras.")
        lineas.append("")
    for r in salida["resultados"]:
        c = r["conteo"]
        lineas.append(f"Página {r['pagina']}")
        if not salida.get("unido"):
            lineas.append(f"  Guardado: {', '.join(r['archivos']) or 'nada'}")
        lineas.append(
            f"  Recuperado: {c.get('lineas', 0) + c.get('polilineas', 0)} líneas y polilíneas, "
            f"{c.get('rellenos', 0)} rellenos de color, {c.get('textos', 0)} textos editables.")
        capas = [k for k in r["capas"] if k != pdf_a_dxf.CAPA_SIN_NOMBRE]
        if capas:
            lineas.append(f"  Capas con dibujo: {', '.join(sorted(capas))}" + (" · los textos van en la capa Textos." if c.get("textos") else ""))
        else:
            lineas.append("  Capas: este PDF no trae capas, todo el dibujo va en una sola capa (SIN_CAPA_PDF).")
        if c.get("textos_corregidos"):
            lineas.append(f"  Se corrigieron las letras de {c['textos_corregidos']} textos que venían mal codificados.")
        if c.get("textos_reconocidos"):
            lineas.append(f"  Se reconocieron {c['textos_reconocidos']} textos que en el PDF eran dibujo, y se pusieron en la capa "
                          f"{pdf_a_dxf.CAPA_TEXTO_OCR}. Son una ayuda y pueden tener errores: en una prueba con un plano de este tipo acertó cerca de "
                          "9 de cada 10 (códigos como CF04 y DM01, la leyenda y los párrafos salen bien; fallan algunos logos, marcas "
                          "punteadas y símbolos). El dibujo original de las letras no se tocó: compara y corrige.")
        elif r["palabras_en_pdf"] == 0 and c.get("rellenos", 0) > 1000:
            motivo = r.get("ocr_motivo") or "No se pidió reconocer letras (opción experimental)."
            lineas.append("  NO hay texto editable: en este PDF las letras son dibujo, no texto. Se ven igual, pero no se pueden "
                          f"editar como texto. {motivo}")
        if c.get("rellenos_sin_area_omitidos"):
            lineas.append(f"  Se omitieron {c['rellenos_sin_area_omitidos']} rellenos sin área (no se veían).")
        if r.get("dwg_avisos"):
            lineas.append(f"  Avisos al crear el DWG: {r['dwg_avisos']}")
        lineas.append("")
    for n in salida["omitidas"]:
        lineas.append(f"Página {n}: NO convertida. Es una imagen escaneada y este programa solo convierte planos vectoriales.")
    lineas.append("")
    lineas.append("Lo que este programa no conserva: transparencias y degradados de color.")
    return "\n".join(lineas)


def estadisticas(salida):
    """Numeros para el aviso final: paginas convertidas, archivos y cosas a revisar."""
    nombres = sorted({a for r in salida["resultados"] for a in r["archivos"]})
    avisos = []
    for r in salida["resultados"]:
        c = r["conteo"]
        if c.get("textos_reconocidos"):
            avisos.append(f"página {r['pagina']}: {c['textos_reconocidos']} textos reconocidos, revísalos")
        elif r["palabras_en_pdf"] == 0 and c.get("rellenos", 0) > 1000:
            avisos.append(f"página {r['pagina']}: las letras son dibujo, no texto editable")
        if r.get("dwg_avisos"):
            avisos.append(f"página {r['pagina']}: avisos al crear el DWG")
    for n in salida["omitidas"]:
        avisos.append(f"página {n}: escaneada, no se convirtió")
    primer_dwg = next((a for a in nombres if a.lower().endswith(".dwg")), None)
    if salida.get("partes", 1) > 1:
        avisos.append(f"se hicieron {salida['partes']} archivos unidos porque uno solo quedaría demasiado pesado")
    return {"paginas": len(salida["resultados"]), "archivos": len(nombres), "nombres": nombres, "avisos": avisos,
            "primer_dwg": primer_dwg, "sin_nada": not nombres, "unido": salida.get("unido", False),
            "carpeta": salida.get("carpeta")}
