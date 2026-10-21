"""Pieza 2: convierte DXF a DWG con la linea de comandos de ODA File Converter.

Uso:  python dxf_a_dwg.py carpeta_dxf carpeta_dwg [version]
Version por defecto ACAD2018 (la abre AutoCAD 2018 o posterior). Para AutoCAD mas antiguo o
editores libres, ACAD2000 o ACAD2004.
"""
import os
import subprocess
import sys
import tempfile
import shutil
from pathlib import Path

# Junto al .exe (programa empaquetado) o en la carpeta del proyecto (modo normal)
_BASE = Path(sys.executable).resolve().parent if getattr(sys, "frozen", False) else Path(__file__).resolve().parent.parent


def _buscar_oda():
    """ODA File Converter: primero la copia portatil junto al programa, luego una instalada en Windows."""
    portatil = _BASE / "herramientas" / "ODA" / "ODAFileConverter.exe"
    if portatil.exists():
        return portatil
    for raiz in (os.environ.get("ProgramFiles"), os.environ.get("ProgramFiles(x86)")):
        if raiz:
            for exe in sorted(Path(raiz).glob("ODA/ODAFileConverter*/ODAFileConverter.exe"), reverse=True):
                return exe
    return portatil


ODA = _buscar_oda()


def disponible():
    return ODA.exists()


VERSIONES = {"ACAD2000", "ACAD2004", "ACAD2007", "ACAD2010", "ACAD2013", "ACAD2018"}


def dxf_a_dwg(carpeta_dxf, carpeta_dwg, version="ACAD2018", tiempo_max=600):
    if version not in VERSIONES:
        raise ValueError(f"version no valida: {version}")
    if not ODA.exists():
        raise FileNotFoundError(f"No esta ODA File Converter en {ODA}")
    carpeta_dxf, carpeta_dwg = Path(carpeta_dxf), Path(carpeta_dwg)
    carpeta_dwg.mkdir(parents=True, exist_ok=True)
    antes = {p.name for p in carpeta_dwg.glob("*.dwg")}
    # "Audit" = 1: ODA repara lo que encuentre. Los avisos quedan en archivos .err.
    r = subprocess.run([str(ODA), str(carpeta_dxf), str(carpeta_dwg), version, "DWG", "0", "1", "*.DXF"],
                       capture_output=True, text=True, timeout=tiempo_max)
    resultado = []
    for dxf in sorted(carpeta_dxf.glob("*.dxf")):
        dwg = carpeta_dwg / (dxf.stem + ".dwg")
        err = carpeta_dwg / (dxf.name + ".err")
        resultado.append({
            "dxf": dxf.name, "dwg": dwg.name, "creado": dwg.exists() and dwg.stat().st_size > 0,
            "avisos": err.read_text(errors="replace").strip() if err.exists() else "",
        })
    return {"codigo_salida": r.returncode, "archivos": resultado}


if __name__ == "__main__":
    ver = sys.argv[3] if len(sys.argv) > 3 else "ACAD2018"
    for a in dxf_a_dwg(sys.argv[1], sys.argv[2], ver)["archivos"]:
        print(a)
