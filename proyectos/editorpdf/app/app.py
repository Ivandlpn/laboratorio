"""Pieza 4: pantalla de PDF a DWG. Arrastra un PDF, elige paginas, pulsa Convertir."""
import json
import os
import queue
import re
import sys
import threading
import time
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, ttk

from PIL import Image, ImageDraw, ImageFont, ImageTk

import motor

try:
    from tkinterdnd2 import DND_FILES, TkinterDnD
    HAY_ARRASTRAR = True
except Exception:  # sin la libreria, queda el boton Abrir
    HAY_ARRASTRAR = False

try:
    import sv_ttk
    HAY_TEMA = True
except Exception:  # sin el tema moderno, se ve con el estilo normal de Windows
    HAY_TEMA = False

AZUL, VERDE, AMBAR, ROJO, TURQUESA, GRIS = "#2563eb", "#16a34a", "#d97706", "#dc2626", "#0d9488", "#6b7280"
PALETAS = {
    "claro": {"fondo": "#fafafa", "zona": "#eef4ff", "zona_sobre": "#d6e4ff", "borde": "#93b4f5", "texto": "#1f2937",
              "suave": "#6b7280", "caja": "#ffffff", "ok": "#15803d", "aviso": "#b45309", "mal": "#b91c1c", "titulo": "#1d4ed8",
              "ok_bg": "#dcfce7", "ok_fg": "#14532d", "aviso_bg": "#fef3c7", "aviso_fg": "#78350f",
              "mal_bg": "#fee2e2", "mal_fg": "#7f1d1d", "papel": "#e5e7eb", "tarjeta": "#ffffff", "tarjeta_sel": "#dbeafe",
              "tarjeta_borde": "#d1d5db"},
    "oscuro": {"fondo": "#1c1c1c", "zona": "#1b2433", "zona_sobre": "#1e3a6e", "borde": "#4f7ad9", "texto": "#f3f4f6",
               "suave": "#9ca3af", "caja": "#262626", "ok": "#4ade80", "aviso": "#fbbf24", "mal": "#f87171", "titulo": "#7aa2ff",
               "ok_bg": "#14301f", "ok_fg": "#bbf7d0", "aviso_bg": "#3a2e10", "aviso_fg": "#fde68a",
               "mal_bg": "#3b1717", "mal_fg": "#fecaca", "papel": "#2f2f2f", "tarjeta": "#262626", "tarjeta_sel": "#1e3a6e",
               "tarjeta_borde": "#3f3f46"},
}
FUENTES = [r"C:/Windows/Fonts/segoeuib.ttf", r"C:/Windows/Fonts/arialbd.ttf"]
AJUSTES = Path(os.environ.get("APPDATA", str(Path.home()))) / "PDFaDWG" / "ajustes.json"
COLUMNAS_TARJETAS = 4
OPCIONES_COLUMNAS = ["Automático", "1", "2", "3", "4", "5", "6", "8", "10"]


def leer_ajustes():
    try:
        return json.loads(AJUSTES.read_text(encoding="utf-8"))
    except Exception:
        return {}


def guardar_ajustes(datos):
    try:
        AJUSTES.parent.mkdir(parents=True, exist_ok=True)
        AJUSTES.write_text(json.dumps(datos, ensure_ascii=False, indent=1), encoding="utf-8")
    except Exception:
        pass


def interpretar_rango(texto, maximo):
    """'1-3, 8, 10-12' -> {1,2,3,8,10,11,12}. Lanza ValueError si no se entiende o se sale del PDF."""
    paginas = set()
    for trozo in re.split(r"[,;\s]+", texto.strip()):
        if not trozo:
            continue
        m = re.fullmatch(r"(\d+)(?:\s*[-–]\s*(\d+))?", trozo)
        if not m:
            raise ValueError(f"No entiendo «{trozo}»")
        a = int(m.group(1))
        b = int(m.group(2) or a)
        if a > b:
            a, b = b, a
        if a < 1 or b > maximo:
            raise ValueError(f"El PDF tiene {maximo} páginas; «{trozo}» se sale")
        paginas.update(range(a, b + 1))
    if not paginas:
        raise ValueError("Escribe un rango, por ejemplo 1-3, 8")
    return paginas


def acortar(ruta, largo=46):
    t = str(ruta)
    return t if len(t) <= largo else t[:18] + "…" + t[-(largo - 19):]


def _fuente(px):
    for f in FUENTES:
        try:
            return ImageFont.truetype(f, px)
        except Exception:
            continue
    return ImageFont.load_default()


def dibujar_icono(tipo, tam, texto=""):
    """Iconos dibujados con formas simples (se hacen 4 veces mas grandes y se reducen, para que no queden dentados)."""
    g = tam * 4
    im = Image.new("RGBA", (g, g), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    blanco = (255, 255, 255, 255)

    def hex_(c):
        return tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)) + (255,)

    if tipo in ("pdf", "dwg", "dxf"):
        color = hex_({"pdf": ROJO, "dwg": AZUL, "dxf": TURQUESA}[tipo])
        d.rounded_rectangle((g * .14, g * .04, g * .86, g * .96), radius=g * .10, fill=color)
        d.polygon([(g * .86, g * .04), (g * .86, g * .30), (g * .60, g * .04)], fill=(255, 255, 255, 90))
        f = _fuente(int(g * .24))
        etiqueta = tipo.upper()
        w = d.textlength(etiqueta, font=f)
        d.text(((g - w) / 2, g * .52), etiqueta, font=f, fill=blanco)
        d.rectangle((g * .28, g * .36, g * .72, g * .40), fill=(255, 255, 255, 190))
        d.rectangle((g * .28, g * .44, g * .60, g * .48), fill=(255, 255, 255, 190))
    elif tipo == "carpeta":
        d.rounded_rectangle((g * .08, g * .14, g * .42, g * .36), radius=g * .06, fill=hex_("#f59e0b"))
        d.rounded_rectangle((g * .08, g * .30, g * .92, g * .84), radius=g * .08, fill=hex_("#fbbf24"))
    elif tipo == "ok":
        d.ellipse((g * .06, g * .06, g * .94, g * .94), fill=hex_(VERDE))
        d.line([(g * .27, g * .52), (g * .43, g * .68), (g * .74, g * .34)], fill=blanco, width=int(g * .11), joint="curve")
    elif tipo == "aviso":
        d.polygon([(g * .5, g * .08), (g * .95, g * .86), (g * .05, g * .86)], fill=hex_(AMBAR))
        d.rounded_rectangle((g * .46, g * .36, g * .54, g * .64), radius=g * .03, fill=blanco)
        d.ellipse((g * .45, g * .69, g * .55, g * .79), fill=blanco)
    elif tipo == "error":
        d.ellipse((g * .06, g * .06, g * .94, g * .94), fill=hex_(ROJO))
        d.line([(g * .32, g * .32), (g * .68, g * .68)], fill=blanco, width=int(g * .1))
        d.line([(g * .68, g * .32), (g * .32, g * .68)], fill=blanco, width=int(g * .1))
    elif tipo == "subir":
        d.rounded_rectangle((g * .12, g * .62, g * .88, g * .90), radius=g * .08, outline=hex_(AZUL), width=int(g * .07))
        d.polygon([(g * .5, g * .10), (g * .76, g * .42), (g * .58, g * .42), (g * .58, g * .66),
                   (g * .42, g * .66), (g * .42, g * .42), (g * .24, g * .42)], fill=hex_(AZUL))
    elif tipo == "flecha":
        d.polygon([(g * .08, g * .38), (g * .56, g * .38), (g * .56, g * .18), (g * .94, g * .5),
                   (g * .56, g * .82), (g * .56, g * .62), (g * .08, g * .62)], fill=hex_(GRIS))
    elif tipo in ("izq", "der"):
        pts = [(g * .66, g * .16), (g * .30, g * .5), (g * .66, g * .84)] if tipo == "izq" else [(g * .34, g * .16), (g * .70, g * .5), (g * .34, g * .84)]
        d.line(pts, fill=hex_(GRIS), width=int(g * .12), joint="curve")
    elif tipo == "unir":  # varias hojas juntas
        for k, (x, y) in enumerate(((.10, .22), (.34, .10), (.46, .38))):
            d.rounded_rectangle((g * x, g * y, g * (x + .42), g * (y + .50)), radius=g * .05, fill=hex_(AZUL) if k != 1 else hex_("#60a5fa"),
                                outline=blanco, width=int(g * .03))
    elif tipo == "paso":
        d.ellipse((g * .04, g * .04, g * .96, g * .96), fill=hex_(AZUL))
        f = _fuente(int(g * .6))
        w = d.textlength(texto, font=f)
        d.text(((g - w) / 2, g * .14), texto, font=f, fill=blanco)
    elif tipo in ("punto_ok", "punto_aviso", "punto_mal"):
        c = {"punto_ok": VERDE, "punto_aviso": AMBAR, "punto_mal": ROJO}[tipo]
        d.ellipse((g * .2, g * .2, g * .8, g * .8), fill=hex_(c))
    return im.resize((tam, tam), Image.LANCZOS)


class Ayuda:
    """Globito de ayuda al pasar el raton por encima."""

    def __init__(self, widget, texto):
        self.widget, self.texto, self.ventana, self.cita = widget, texto, None, None
        widget.bind("<Enter>", self._programar, add="+")
        widget.bind("<Leave>", self._ocultar, add="+")
        widget.bind("<ButtonPress>", self._ocultar, add="+")

    def _programar(self, _):
        self._ocultar()
        self.cita = self.widget.after(500, self._mostrar)

    def _mostrar(self):
        x, y = self.widget.winfo_rootx() + 12, self.widget.winfo_rooty() + self.widget.winfo_height() + 6
        self.ventana = tk.Toplevel(self.widget)
        self.ventana.wm_overrideredirect(True)
        self.ventana.wm_geometry(f"+{x}+{y}")
        tk.Label(self.ventana, text=self.texto, justify="left", wraplength=340, bg="#111827", fg="#f9fafb",
                 padx=10, pady=6, font=("Segoe UI", 9)).pack()

    def _ocultar(self, _=None):
        if self.cita:
            self.widget.after_cancel(self.cita)
            self.cita = None
        if self.ventana:
            self.ventana.destroy()
            self.ventana = None


class App:
    def __init__(self, raiz):
        self.raiz = raiz
        raiz.title("PDF a DWG")
        self.ajustes = leer_ajustes()
        self.escala = max(1.0, raiz.winfo_fpixels("1i") / 96.0)
        self._geometria_inicial()
        raiz.minsize(int(900 * self.escala), min(int(700 * self.escala), raiz.winfo_screenheight() - 150))
        self.tema = self.ajustes.get("tema", "claro")
        self.iconos = {}
        self.ruta = None
        self.paginas = []
        self.marcas = {}
        self.tarjetas = {}
        self.thumbs = {}
        self.id_carga = 0
        self.cola = queue.Queue()
        self.trabajando = False
        self.cancelar = False
        self.t_inicio = 0.0
        self.sobre_zona = False
        self.mini_cache = {}
        self.mini_actual = None
        self.pagina_vista = None
        self.cita_mini = None
        self.estadisticas = None
        self.destino = None
        self.detalles_abiertos = False
        self._texto_resumen = ""
        if HAY_TEMA:
            sv_ttk.set_theme("dark" if self.tema == "oscuro" else "light")
        try:
            raiz.iconphoto(True, self._icono("dwg", 32))
        except Exception:
            pass
        self._armar()
        self._aplicar_ajustes()
        self._aplicar_colores()
        raiz.bind("<Control-o>", lambda e: self.abrir())
        raiz.bind("<Control-Return>", lambda e: self.convertir())
        raiz.bind("<Escape>", lambda e: self.pedir_cancelar())
        raiz.protocol("WM_DELETE_WINDOW", self._cerrar)
        self.raiz.after(100, self._revisar_cola)

    def _geometria_inicial(self):
        ancho_max, alto_max = self.raiz.winfo_screenwidth() - 40, self.raiz.winfo_screenheight() - 150
        ancho, alto = min(int(1100 * self.escala), ancho_max), min(int(930 * self.escala), alto_max)
        x, y = 40, 20
        guardada = self.ajustes.get("geometria", "")
        m = re.fullmatch(r"(\d+)x(\d+)\+(-?\d+)\+(-?\d+)", guardada)
        if m:
            w, h, gx, gy = map(int, m.groups())
            if 700 <= w <= ancho_max and 500 <= h <= alto_max + 100 and 0 <= gx < self.raiz.winfo_screenwidth() - 200 and 0 <= gy < self.raiz.winfo_screenheight() - 150:
                ancho, alto, x, y = w, h, gx, gy
        self.raiz.geometry(f"{ancho}x{alto}+{x}+{y}")

    # ---------- iconos, colores y ajustes ----------
    def _icono(self, tipo, tam=22, texto=""):
        clave = (tipo, tam, texto)
        if clave not in self.iconos:
            px = int(tam * self.escala)
            self.iconos[clave] = ImageTk.PhotoImage(dibujar_icono(tipo, px, texto))
        return self.iconos[clave]

    def _p(self, nombre):
        return PALETAS[self.tema][nombre]

    def _aplicar_ajustes(self):
        a = self.ajustes
        self.var_dxf.set(a.get("dxf", True))
        self.var_dwg.set(a.get("dwg", True) and motor.dxf_a_dwg.disponible())
        self.var_ocr.set(a.get("ocr", False))
        self.var_unir.set(a.get("unir", False))
        self.var_etiquetar.set(a.get("etiquetar", True))
        if a.get("columnas") in OPCIONES_COLUMNAS:
            self.var_cols.set(a["columnas"])
        if a.get("version") in motor.VERSIONES_DWG:
            self.var_version.set(a["version"])
        self.var_oscuro.set(self.tema == "oscuro")
        self._modo_cambiado()

    def _cerrar(self):
        self.ajustes.update({"tema": self.tema, "dxf": self.var_dxf.get(), "dwg": self.var_dwg.get(),
                             "ocr": self.var_ocr.get(), "version": self.var_version.get(), "unir": self.var_unir.get(),
                             "etiquetar": self.var_etiquetar.get(), "columnas": self.var_cols.get(),
                             "geometria": self.raiz.geometry()})
        guardar_ajustes(self.ajustes)
        self.raiz.destroy()

    def _aplicar_colores(self):
        p = PALETAS[self.tema]
        self.raiz.configure(bg=p["fondo"])
        self.resumen.configure(bg=p["caja"], fg=p["texto"], insertbackground=p["texto"],
                               highlightbackground=p["borde"], highlightcolor=p["borde"])
        self.lienzo.configure(bg=p["fondo"])
        self.etq_estado.configure(foreground=p["suave"])
        self.resumen.tag_configure("titulo", foreground=p["titulo"], font=("Segoe UI Semibold", 10), spacing1=8)
        self.resumen.tag_configure("ok", foreground=p["ok"])
        self.resumen.tag_configure("aviso", foreground=p["aviso"])
        self.resumen.tag_configure("mal", foreground=p["mal"], font=("Segoe UI Semibold", 9))
        self.resumen.tag_configure("suave", foreground=p["suave"])
        self.papel.configure(bg=p["papel"])
        self.etq_mini.configure(bg=p["papel"], fg=p["suave"])
        self._dibujar_zona()
        self._pintar_aviso()
        for n in self.tarjetas:
            self._pintar_tarjeta(n)

    def _cambiar_tema(self):
        self.tema = "oscuro" if self.var_oscuro.get() else "claro"
        if HAY_TEMA:
            sv_ttk.set_theme("dark" if self.tema == "oscuro" else "light")
        self._aplicar_colores()
        self._refrescar_resumen()

    # ---------- construccion ----------
    def _titulo_paso(self, padre, numero, texto):
        fila = ttk.Frame(padre)
        tk.Label(fila, image=self._icono("paso", 24, str(numero)), bd=0).pack(side="left")
        ttk.Label(fila, text=texto, font=("Segoe UI Semibold", 11)).pack(side="left", padx=8)
        return fila

    def _armar(self):
        cuerpo = ttk.Frame(self.raiz, padding=(20, 12))
        cuerpo.pack(fill="both", expand=True)

        # Encabezado
        cab = ttk.Frame(cuerpo)
        cab.pack(fill="x")
        for tipo in ("pdf", "flecha", "dwg"):
            tk.Label(cab, image=self._icono(tipo, 34), bd=0).pack(side="left", padx=(0, 4))
        textos = ttk.Frame(cab)
        textos.pack(side="left", padx=10)
        ttk.Label(textos, text="PDF a DWG", font=("Segoe UI Semibold", 18)).pack(anchor="w")
        ttk.Label(textos, text="Convierte planos en PDF a archivos editables en AutoCAD u otro editor.").pack(anchor="w")
        self.var_oscuro = tk.BooleanVar(value=False)
        if HAY_TEMA:
            ttk.Checkbutton(cab, text="Modo oscuro", style="Switch.TCheckbutton", variable=self.var_oscuro,
                            command=self._cambiar_tema).pack(side="right")

        centro = ttk.Frame(cuerpo)
        centro.pack(fill="both", expand=True, pady=(6, 0))
        centro.columnconfigure(0, weight=3)
        centro.columnconfigure(1, weight=2, minsize=int(320 * self.escala))
        centro.rowconfigure(0, weight=1)
        izq = ttk.Frame(centro)
        izq.grid(row=0, column=0, sticky="nsew", padx=(0, 18))
        der = ttk.Frame(centro)
        der.grid(row=0, column=1, sticky="nsew")

        # Paso 1
        fila1 = ttk.Frame(izq)
        fila1.pack(fill="x", pady=(4, 6))
        self._titulo_paso(fila1, 1, "Elige el PDF").pack(side="left")
        self.boton_recientes = ttk.Button(fila1, text="Recientes ▾", command=self._menu_recientes)
        self.boton_recientes.pack(side="right")
        self.zona = tk.Canvas(izq, height=int(64 * self.escala), highlightthickness=0, cursor="hand2")
        self.zona.pack(fill="x")
        self.zona.bind("<Configure>", lambda e: self._dibujar_zona())
        self.zona.bind("<Button-1>", lambda e: self.abrir())
        Ayuda(self.zona, "Arrastra aquí un PDF o pulsa para elegirlo (Ctrl+O).")
        if HAY_ARRASTRAR:
            self.zona.drop_target_register(DND_FILES)
            self.zona.dnd_bind("<<Drop>>", self._soltado)
            self.zona.dnd_bind("<<DropEnter>>", lambda e: self._sobre(True))
            self.zona.dnd_bind("<<DropLeave>>", lambda e: self._sobre(False))

        # Paso 2
        cab2 = ttk.Frame(izq)
        cab2.pack(fill="x", pady=(12, 4))
        self._titulo_paso(cab2, 2, "Elige las páginas").pack(side="left")
        self.etq_contador = ttk.Label(cab2, text="")
        self.etq_contador.pack(side="left", padx=12)
        ttk.Button(cab2, text="Ninguna", command=lambda: self._marcar_todas(False)).pack(side="right")
        ttk.Button(cab2, text="Todas", command=lambda: self._marcar_todas(True)).pack(side="right", padx=6)
        fila_rango = ttk.Frame(izq)
        fila_rango.pack(fill="x", pady=(0, 4))
        ttk.Label(fila_rango, text="Rango:").pack(side="left")
        self.var_rango = tk.StringVar()
        entrada = ttk.Entry(fila_rango, textvariable=self.var_rango, width=18)
        entrada.pack(side="left", padx=6)
        entrada.bind("<Return>", lambda e: self._aplicar_rango())
        ttk.Button(fila_rango, text="Marcar solo ese rango", command=self._aplicar_rango).pack(side="left")
        ttk.Label(fila_rango, text="ej.  1-5, 8, 10-12").pack(side="left", padx=10)
        Ayuda(entrada, "Escribe qué páginas quieres, por ejemplo 1-5, 8, 10-12, y pulsa Enter.")

        zona_lista = ttk.Frame(izq)
        zona_lista.pack(fill="both", expand=True)
        self.lienzo = tk.Canvas(zona_lista, height=int(120 * self.escala), highlightthickness=0)
        desliz = ttk.Scrollbar(zona_lista, orient="vertical", command=self.lienzo.yview)
        self.lienzo.configure(yscrollcommand=desliz.set)
        desliz.pack(side="right", fill="y")
        self.lienzo.pack(side="left", fill="both", expand=True)
        self.lista = tk.Frame(self.lienzo, bd=0, highlightthickness=0)
        self.lienzo.create_window((0, 0), window=self.lista, anchor="nw", tags="lista")
        self.lista.bind("<Configure>", lambda e: self.lienzo.configure(scrollregion=self.lienzo.bbox("all")))
        self.lienzo.bind("<Configure>", lambda e: self.lienzo.itemconfigure("lista", width=e.width))
        self.raiz.bind_all("<MouseWheel>", self._rueda)
        self.etq_vacia = ttk.Label(self.lista, text="Aquí aparecerán las páginas del PDF.")
        self.etq_vacia.grid(row=0, column=0, sticky="w", pady=8, padx=4)

        # Paso 3
        self._titulo_paso(izq, 3, "Qué quieres obtener").pack(fill="x", pady=(12, 4))
        fila = ttk.Frame(izq)
        fila.pack(fill="x")
        self.var_dxf = tk.BooleanVar(value=True)
        self.var_dwg = tk.BooleanVar(value=True)
        tk.Label(fila, image=self._icono("dxf", 24), bd=0).pack(side="left")
        c_dxf = ttk.Checkbutton(fila, text="DXF", variable=self.var_dxf, command=self._actualizar_previsto)
        c_dxf.pack(side="left", padx=(4, 18))
        Ayuda(c_dxf, "DXF: formato abierto. Lo abren AutoCAD, LibreCAD, QCAD y casi cualquier editor.")
        tk.Label(fila, image=self._icono("dwg", 24), bd=0).pack(side="left")
        c_dwg = ttk.Checkbutton(fila, text="DWG", variable=self.var_dwg, command=self._actualizar_previsto)
        c_dwg.pack(side="left", padx=(4, 18))
        Ayuda(c_dwg, "DWG: formato nativo de AutoCAD. Se crea con ODA File Converter (gratis solo para uso no comercial).")
        if not motor.dxf_a_dwg.disponible():
            c_dwg.state(["disabled"])
            Ayuda(c_dwg, "Falta la carpeta «herramientas» (ODA File Converter) junto al programa, así que solo se puede crear DXF.")
        ttk.Label(fila, text="Versión:").pack(side="left", padx=(8, 6))
        self.var_version = tk.StringVar(value=next(iter(motor.VERSIONES_DWG)))
        combo = ttk.Combobox(fila, textvariable=self.var_version, values=list(motor.VERSIONES_DWG), state="readonly", width=24)
        combo.pack(side="left")
        Ayuda(combo, "Elige la versión de AutoCAD más antigua que tenga alguien de tu equipo.")

        fila_modo = ttk.Frame(izq)
        fila_modo.pack(fill="x", pady=(8, 0))
        self.var_unir = tk.BooleanVar(value=False)
        tk.Label(fila_modo, image=self._icono("unir", 22), bd=0).pack(side="left")
        r1 = ttk.Radiobutton(fila_modo, text="Un archivo por página", variable=self.var_unir, value=False, command=self._modo_cambiado)
        r1.pack(side="left", padx=(6, 14))
        r2 = ttk.Radiobutton(fila_modo, text="Todas las páginas en un solo archivo", variable=self.var_unir, value=True, command=self._modo_cambiado)
        r2.pack(side="left")
        Ayuda(r2, "Junta las páginas marcadas en un único DXF/DWG, una junto a otra en cuadrícula. "
                  "Si quedara demasiado pesado, se parte automáticamente en varios archivos unidos.")
        self.zona_union = ttk.Frame(izq)
        self.zona_union.pack(fill="x")
        self.fila_union = ttk.Frame(self.zona_union)
        ttk.Label(self.fila_union, text="Páginas por fila:").pack(side="left", padx=(30, 6))
        self.var_cols = tk.StringVar(value="Automático")
        combo_cols = ttk.Combobox(self.fila_union, textvariable=self.var_cols, values=OPCIONES_COLUMNAS, state="readonly", width=11)
        combo_cols.pack(side="left")
        combo_cols.bind("<<ComboboxSelected>>", lambda e: self._actualizar_previsto())
        self.var_etiquetar = tk.BooleanVar(value=True)
        c_etq = ttk.Checkbutton(self.fila_union, text="Poner un rótulo «Página N» sobre cada una", variable=self.var_etiquetar)
        c_etq.pack(side="left", padx=18)
        Ayuda(c_etq, "El rótulo va en la capa Etiquetas_paginas; puedes apagarla en tu editor.")

        fila_ocr = ttk.Frame(izq)
        fila_ocr.pack(fill="x", pady=(8, 0))
        self.var_ocr = tk.BooleanVar(value=False)
        tk.Label(fila_ocr, image=self._icono("aviso", 20), bd=0).pack(side="left")
        c_ocr = ttk.Checkbutton(fila_ocr, text="Reconocer letras que en el PDF son dibujo (experimental)", variable=self.var_ocr)
        c_ocr.pack(side="left", padx=6)
        Ayuda(c_ocr, "Solo para páginas sin texto real. Intenta convertir las letras dibujadas en texto editable. "
                     "Acierta cerca de 9 de cada 10; revisa el resultado en la capa Texto_reconocido_REVISAR. Es más lento.")

        fila_dest = ttk.Frame(izq)
        fila_dest.pack(fill="x", pady=(8, 0))
        tk.Label(fila_dest, image=self._icono("carpeta", 20), bd=0).pack(side="left")
        ttk.Label(fila_dest, text="Guardar en:").pack(side="left", padx=(6, 6))
        self.etq_destino = ttk.Label(fila_dest, text="junto al PDF")
        self.etq_destino.pack(side="left")
        ttk.Button(fila_dest, text="Cambiar…", command=self._elegir_destino).pack(side="left", padx=10)
        self.boton_junto = ttk.Button(fila_dest, text="Junto al PDF", command=self._destino_junto)
        self.etq_previsto = ttk.Label(izq, text="", wraplength=int(600 * self.escala), justify="left")
        self.etq_previsto.pack(fill="x", pady=(8, 0))

        # Vista previa
        cab_v = ttk.Frame(der)
        cab_v.pack(fill="x", pady=(4, 6))
        ttk.Label(cab_v, text="Vista previa", font=("Segoe UI Semibold", 11)).pack(side="left")
        self.etq_vista = ttk.Label(cab_v, text="")
        self.etq_vista.pack(side="right")
        self.papel = tk.Frame(der, highlightthickness=0)
        self.papel.pack(fill="both", expand=True)
        self.etq_mini = tk.Label(self.papel, text="Aquí verás la página\nque señales con el ratón.", justify="center")
        self.etq_mini.pack(fill="both", expand=True, padx=6, pady=6)
        nav = ttk.Frame(der)
        nav.pack(fill="x", pady=(6, 0))
        ttk.Button(nav, image=self._icono("izq", 16), command=lambda: self._mover_vista(-1)).pack(side="left")
        ttk.Button(nav, image=self._icono("der", 16), command=lambda: self._mover_vista(1)).pack(side="right")
        ttk.Label(nav, text="Pasa el ratón por una página\no usa las flechas.", justify="center").pack()

        # Paso 4
        base = ttk.Frame(cuerpo)
        base.pack(side="bottom", fill="x", pady=(8, 0))
        centro.pack_forget()
        centro.pack(fill="both", expand=True, pady=(6, 0))
        self._titulo_paso(base, 4, "Convierte").pack(fill="x", pady=(0, 4))
        fila4 = ttk.Frame(base)
        fila4.pack(fill="x")
        self.boton = ttk.Button(fila4, text="  Convertir  ", style="Accent.TButton" if HAY_TEMA else "TButton",
                                command=self.convertir, state="disabled")
        self.boton.pack(side="left")
        Ayuda(self.boton, "Convierte las páginas marcadas (Ctrl+Intro).")
        self.boton_cancelar = ttk.Button(fila4, text="Cancelar", command=self.pedir_cancelar)
        self.etq_pct = ttk.Label(fila4, text="", width=6, anchor="e")
        self.etq_pct.pack(side="right")
        self.barra = ttk.Progressbar(fila4, maximum=100)
        self.barra.pack(side="left", fill="x", expand=True, padx=14)
        fila_estado = ttk.Frame(base)
        fila_estado.pack(fill="x")
        self.icono_estado = tk.Label(fila_estado, bd=0)
        self.icono_estado.pack(side="left")
        self.etq_estado = ttk.Label(fila_estado, text="")
        self.etq_estado.pack(side="left", padx=4)

        self.aviso = tk.Frame(base, padx=12, pady=8)
        self.aviso_icono = tk.Label(self.aviso, bd=0)
        self.aviso_icono.pack(side="left")
        textos_aviso = tk.Frame(self.aviso)
        textos_aviso.pack(side="left", fill="x", expand=True, padx=10)
        self.aviso_titulo = tk.Label(textos_aviso, anchor="w", font=("Segoe UI Semibold", 11), justify="left")
        self.aviso_titulo.pack(fill="x")
        self.aviso_detalle = tk.Label(textos_aviso, anchor="w", font=("Segoe UI", 9), justify="left", wraplength=int(600 * self.escala))
        self.aviso_detalle.pack(fill="x")
        botones = tk.Frame(self.aviso)
        botones.pack(side="right")
        self.boton_carpeta = ttk.Button(botones, text=" Abrir carpeta", image=self._icono("carpeta", 18), compound="left",
                                        command=self.abrir_carpeta)
        self.boton_carpeta.pack(side="left", padx=4)
        self.boton_dwg = ttk.Button(botones, text=" Abrir DWG", image=self._icono("dwg", 18), compound="left", command=self.abrir_dwg)
        self.boton_dwg.pack(side="left", padx=4)
        self.boton_detalles = ttk.Button(botones, text="Detalles ▾", command=self._alternar_detalles)
        self.boton_detalles.pack(side="left", padx=4)

        self.marco_detalles = ttk.Frame(base)
        self.resumen = tk.Text(self.marco_detalles, height=7, wrap="word", font=("Segoe UI", 10), state="disabled",
                               relief="flat", highlightthickness=1, padx=10, pady=6)
        sc = ttk.Scrollbar(self.marco_detalles, orient="vertical", command=self.resumen.yview)
        self.resumen.configure(yscrollcommand=sc.set)
        sc.pack(side="right", fill="y")
        self.resumen.pack(side="left", fill="both", expand=True)

    # ---------- opciones ----------
    def _modo_cambiado(self):
        if self.var_unir.get():
            self.fila_union.pack(fill="x", pady=(4, 0))
        else:
            self.fila_union.pack_forget()
        self._actualizar_previsto()

    def _columnas(self):
        v = self.var_cols.get()
        return None if v == "Automático" else int(v)

    def _elegir_destino(self):
        carpeta = filedialog.askdirectory(title="Carpeta donde guardar", initialdir=str(self.destino or (self.ruta.parent if self.ruta else Path.home())))
        if carpeta:
            self.destino = Path(carpeta)
            self.etq_destino.config(text=acortar(self.destino))
            self.boton_junto.pack(side="left")
            self._actualizar_previsto()

    def _destino_junto(self):
        self.destino = None
        self.etq_destino.config(text="junto al PDF")
        self.boton_junto.pack_forget()
        self._actualizar_previsto()

    def _actualizar_previsto(self):
        if not self.ruta:
            self.etq_previsto.config(text="")
            return
        elegidas = [n for n, v in self.marcas.items() if v.get()]
        if not elegidas:
            self.etq_previsto.config(text="Marca al menos una página.")
            return
        if not (self.var_dxf.get() or self.var_dwg.get()):
            self.etq_previsto.config(text="Marca DXF, DWG o los dos.")
            return
        unir = self.var_unir.get()
        nombres = [p.name for p in motor.nombres_salida(self.ruta, elegidas, self.var_dxf.get(), self.var_dwg.get(), unir, self.destino)]
        if unir:
            texto = "Se creará: " + ", ".join(nombres)
            if len(elegidas) > 8:
                texto += ". Con muchas páginas pesadas tarda varios minutos y, si pesa demasiado, se parte en varios archivos unidos."
        elif len(nombres) <= 4:
            texto = "Se crearán: " + ", ".join(nombres)
        else:
            texto = f"Se crearán {len(nombres)} archivos: {nombres[0]} … {nombres[-1]}"
        self.etq_previsto.config(text=texto)

    # ---------- zona de arrastrar y recientes ----------
    def _sobre(self, valor):
        self.sobre_zona = valor
        self._dibujar_zona()

    def _dibujar_zona(self):
        z = self.zona
        z.delete("all")
        w, h = max(z.winfo_width(), 200), max(z.winfo_height(), 60)
        relleno = self._p("zona_sobre") if self.sobre_zona else self._p("zona")
        z.configure(bg=self._p("fondo"))
        z.create_rectangle(2, 2, w - 2, h - 2, fill=relleno, outline=self._p("borde"), width=2, dash=(7, 5))
        cx = 24 * self.escala + 44 * self.escala
        if self.ruta:
            z.create_image(24 * self.escala, h / 2, image=self._icono("pdf", 38), anchor="w")
            z.create_text(cx + 10, h / 2 - 11, text=self.ruta.name, anchor="w", fill=self._p("texto"), font=("Segoe UI Semibold", 11))
            z.create_text(cx + 10, h / 2 + 11, text=f"{len(self.paginas)} página(s) · pulsa o arrastra otro PDF para cambiarlo",
                          anchor="w", fill=self._p("suave"), font=("Segoe UI", 9))
        else:
            z.create_image(24 * self.escala, h / 2, image=self._icono("subir", 40), anchor="w")
            z.create_text(cx + 10, h / 2 - 11, text="Arrastra aquí tu PDF", anchor="w", fill=self._p("texto"), font=("Segoe UI Semibold", 13))
            z.create_text(cx + 10, h / 2 + 11, text="o pulsa aquí para elegirlo (Ctrl+O)", anchor="w", fill=self._p("suave"), font=("Segoe UI", 10))

    def _menu_recientes(self):
        menu = tk.Menu(self.raiz, tearoff=0)
        recientes = [r for r in self.ajustes.get("recientes", []) if Path(r).exists()]
        for r in recientes:
            menu.add_command(label=f"{Path(r).name}    ({acortar(Path(r).parent, 40)})", command=lambda r=r: self.cargar(r))
        if recientes:
            menu.add_separator()
            menu.add_command(label="Borrar la lista", command=lambda: self.ajustes.update({"recientes": []}))
        else:
            menu.add_command(label="Todavía no hay PDF recientes", state="disabled")
        b = self.boton_recientes
        menu.tk_popup(b.winfo_rootx(), b.winfo_rooty() + b.winfo_height())

    # ---------- elegir el PDF ----------
    def _rueda(self, evento):
        if self.lienzo.winfo_exists() and self.lista.winfo_height() > self.lienzo.winfo_height():
            self.lienzo.yview_scroll(int(-evento.delta / 120), "units")

    def abrir(self):
        ruta = filedialog.askopenfilename(title="Elige un PDF", filetypes=[("PDF", "*.pdf")],
                                          initialdir=self.ajustes.get("carpeta") or None)
        if ruta:
            self.cargar(ruta)

    def _soltado(self, evento):
        self._sobre(False)
        for ruta in self.raiz.tk.splitlist(evento.data):
            if ruta.lower().endswith(".pdf"):
                self.cargar(ruta)
                return
        messagebox.showinfo("PDF a DWG", "Ese archivo no es un PDF.")

    def cargar(self, ruta):
        try:
            paginas = motor.analizar(ruta)
        except Exception as e:
            messagebox.showerror("PDF a DWG", f"No se pudo abrir el PDF:\n{e}")
            return
        self.ruta, self.paginas = Path(ruta), paginas
        self.ajustes["carpeta"] = str(self.ruta.parent)
        rec = [r for r in self.ajustes.get("recientes", []) if r != str(self.ruta)]
        self.ajustes["recientes"] = ([str(self.ruta)] + rec)[:8]
        self.mini_cache, self.pagina_vista = {}, None
        self.id_carga += 1
        for w in self.lista.winfo_children():
            w.destroy()
        self.marcas, self.tarjetas, self.thumbs = {}, {}, {}
        ancho_mini = int(118 * self.escala)
        for k, p in enumerate(paginas):
            n = p["pagina"]
            var = tk.BooleanVar(value=not p["escaneada"])
            var.trace_add("write", lambda *a: self._contar())
            self.marcas[n] = var
            if p["escaneada"]:
                punto, nota = "punto_mal", "escaneada"
            elif p["palabras"]:
                punto, nota = "punto_ok", "con texto"
            else:
                punto, nota = "punto_aviso", "letras dibujadas"
            tarjeta = tk.Frame(self.lista, bd=0, highlightthickness=2, padx=6, pady=6, cursor="hand2")
            tarjeta.grid(row=k // COLUMNAS_TARJETAS, column=k % COLUMNAS_TARJETAS, padx=4, pady=4, sticky="n")
            alto_mini = int(ancho_mini * p["alto_mm"] / max(1, p["ancho_mm"]))
            vacia = ImageTk.PhotoImage(Image.new("RGB", (ancho_mini, alto_mini), "#e5e7eb"))
            miniatura = tk.Label(tarjeta, image=vacia, bd=0)
            miniatura.image = vacia
            miniatura.pack()
            pie = tk.Frame(tarjeta, bd=0)
            pie.pack(fill="x", pady=(4, 0))
            tk.Label(pie, image=self._icono(punto, 12), bd=0).pack(side="left")
            etiqueta = tk.Label(pie, text=f"Página {n}", font=("Segoe UI Semibold", 9), bd=0)
            etiqueta.pack(side="left", padx=4)
            nota_l = tk.Label(pie, text=nota, font=("Segoe UI", 8), bd=0)
            nota_l.pack(side="right")
            widgets = [tarjeta, miniatura, pie, etiqueta, nota_l]
            self.tarjetas[n] = {"tarjeta": tarjeta, "miniatura": miniatura, "pie": pie, "textos": [etiqueta, nota_l], "escaneada": p["escaneada"]}
            for w in widgets:
                w.bind("<Button-1>", lambda e, n=n: self._alternar(n), add="+")
                w.bind("<Enter>", lambda e, n=n: self._vista_con_retraso(n), add="+")
            self._pintar_tarjeta(n)
        self.etq_vacia = None
        self.boton.config(state="normal")
        self._ocultar_aviso()
        self.etq_estado.config(text="")
        self.icono_estado.config(image="")
        self.barra["value"] = 0
        self.etq_pct.config(text="")
        self._contar()
        self._dibujar_zona()
        self.mostrar_vista(next((p["pagina"] for p in paginas if not p["escaneada"]), 1))
        self._cargar_miniaturas(str(self.ruta), self.id_carga, ancho_mini)

    def _pintar_tarjeta(self, n):
        t = self.tarjetas.get(n)
        if not t:
            return
        marcada = self.marcas[n].get()
        fondo = self._p("tarjeta_sel") if marcada else self._p("tarjeta")
        borde = AZUL if marcada else self._p("tarjeta_borde")
        for w in (t["tarjeta"], t["pie"], t["miniatura"]):
            w.configure(bg=fondo)
        t["tarjeta"].configure(highlightbackground=borde, highlightcolor=borde)
        for w in t["textos"]:
            w.configure(bg=fondo, fg=self._p("texto") if not t["escaneada"] else self._p("mal"))
        for w in t["pie"].winfo_children():
            try:
                w.configure(bg=fondo)
            except tk.TclError:
                pass

    def _alternar(self, n):
        if self.tarjetas[n]["escaneada"] or self.trabajando:
            return
        self.marcas[n].set(not self.marcas[n].get())

    def _cargar_miniaturas(self, ruta, id_carga, ancho):
        def trabajo():
            for n in range(1, len(self.paginas) + 1):
                if self.id_carga != id_carga:
                    return
                try:
                    w, h, datos = motor.miniatura(ruta, n, ancho)
                    imagen = Image.frombytes("RGB", (w, h), datos)
                except Exception:
                    imagen = None
                self.cola.put(("thumb", id_carga, n, imagen))
        threading.Thread(target=trabajo, daemon=True).start()

    def _contar(self):
        total = len(self.marcas)
        marcadas = sum(1 for v in self.marcas.values() if v.get())
        self.etq_contador.config(text=f"{marcadas} de {total} seleccionadas")
        for n in list(self.tarjetas):
            self._pintar_tarjeta(n)
        self._actualizar_previsto()

    def _marcar_todas(self, valor):
        for n, var in self.marcas.items():
            if not self.tarjetas[n]["escaneada"]:
                var.set(valor)

    def _aplicar_rango(self):
        if not self.marcas:
            return
        try:
            elegidas = interpretar_rango(self.var_rango.get(), len(self.paginas))
        except ValueError as e:
            messagebox.showinfo("PDF a DWG", str(e))
            return
        for n, var in self.marcas.items():
            var.set(n in elegidas and not self.tarjetas[n]["escaneada"])

    # ---------- vista previa ----------
    def _vista_con_retraso(self, n):
        if self.cita_mini:
            self.raiz.after_cancel(self.cita_mini)
        self.cita_mini = self.raiz.after(250, lambda: self.mostrar_vista(n))

    def _mover_vista(self, paso):
        if self.paginas and self.pagina_vista:
            self.mostrar_vista(max(1, min(len(self.paginas), self.pagina_vista + paso)))

    def mostrar_vista(self, n):
        if not self.ruta or n == self.pagina_vista:
            return
        self.pagina_vista = n
        self.etq_vista.config(text=f"Página {n} de {len(self.paginas)}")
        if n in self.mini_cache:
            self._poner_mini(self.mini_cache[n])
            return
        self.etq_mini.config(image="", text="Dibujando la página…")
        ruta, id_carga = str(self.ruta), self.id_carga

        def trabajo():
            try:
                w, h, datos = motor.miniatura(ruta, n, int(380 * self.escala))
                self.cola.put(("mini", n, id_carga, Image.frombytes("RGB", (w, h), datos)))
            except Exception:
                self.cola.put(("mini", n, id_carga, None))
        threading.Thread(target=trabajo, daemon=True).start()

    def _poner_mini(self, imagen):
        if imagen is None:
            self.etq_mini.config(image="", text="No se pudo dibujar\nla vista previa.")
            return
        self.mini_actual = ImageTk.PhotoImage(imagen)
        self.etq_mini.config(image=self.mini_actual, text="")

    # ---------- convertir ----------
    def convertir(self):
        if self.trabajando or not self.ruta or str(self.boton["state"]) == "disabled":
            return
        elegidas = [n for n, v in self.marcas.items() if v.get()]
        if not elegidas:
            messagebox.showinfo("PDF a DWG", "Marca al menos una página.")
            return
        if not (self.var_dxf.get() or self.var_dwg.get()):
            messagebox.showinfo("PDF a DWG", "Marca DXF, DWG o los dos.")
            return
        unir = self.var_unir.get()
        hay = [p.name for p in motor.existentes(self.ruta, elegidas, self.var_dxf.get(), self.var_dwg.get(), unir, self.destino)]
        if hay:
            lista = "\n".join(hay[:8]) + ("\n…" if len(hay) > 8 else "")
            if not messagebox.askyesno("PDF a DWG", f"Estos archivos ya existen y se van a reemplazar:\n\n{lista}\n\n¿Reemplazarlos?"):
                return
        self.trabajando, self.cancelar, self.t_inicio = True, False, time.monotonic()
        self.boton.config(state="disabled")
        self.boton_cancelar.config(state="normal")
        self.boton_cancelar.pack(side="left", before=self.barra)
        self._ocultar_aviso()
        self.icono_estado.config(image="")
        version = motor.VERSIONES_DWG[self.var_version.get()]
        args = (str(self.ruta), elegidas, self.var_dxf.get(), self.var_dwg.get(), version, self.var_ocr.get(),
                unir, self._columnas(), self.var_etiquetar.get(), self.destino)
        threading.Thread(target=self._trabajo, args=args, daemon=True).start()

    def pedir_cancelar(self):
        if self.trabajando and not self.cancelar:
            self.cancelar = True
            self.boton_cancelar.config(state="disabled")
            self.etq_estado.config(text="Cancelando al terminar la página en curso…")

    def _trabajo(self, ruta, paginas, dxf, dwg, version, ocr, unir, columnas, etiquetar, destino):
        try:
            salida = motor.convertir(ruta, paginas, dxf, dwg, version, lambda t, f: self.cola.put(("avance", t, f)), ocr,
                                     lambda: self.cancelar, unir, columnas, etiquetar, destino)
            self.cola.put(("fin", motor.resumen_texto(ruta, salida), motor.estadisticas(salida)))
        except motor.Cancelado:
            self.cola.put(("cancelado",))
        except Exception as e:
            self.cola.put(("error", str(e)))

    def _terminar(self):
        self.trabajando = False
        self.boton.config(state="normal")
        self.boton_cancelar.pack_forget()

    def _revisar_cola(self):
        try:
            while True:
                msg = self.cola.get_nowait()
                if msg[0] == "avance":
                    self.etq_estado.config(text=msg[1])
                    self.barra["value"] = msg[2] * 100
                    self.etq_pct.config(text=f"{int(msg[2] * 100)} %")
                elif msg[0] == "fin":
                    self._terminar()
                    self.etq_estado.config(text="")
                    self.barra["value"] = 100
                    self.etq_pct.config(text="100 %")
                    self._texto_resumen, self.estadisticas = msg[1], dict(msg[2], segundos=int(time.monotonic() - self.t_inicio))
                    self._refrescar_resumen()
                    self._pintar_aviso()
                elif msg[0] == "cancelado":
                    self._terminar()
                    self.barra["value"] = 0
                    self.etq_pct.config(text="")
                    self.etq_estado.config(text="Conversión cancelada. No se guardó ningún archivo.")
                    self.icono_estado.config(image=self._icono("aviso", 18))
                elif msg[0] == "error":
                    self._terminar()
                    self.etq_estado.config(text="")
                    self._texto_resumen = f"No se pudo convertir:\n{msg[1]}"
                    self.estadisticas = {"error": msg[1]}
                    self._refrescar_resumen()
                    self._pintar_aviso()
                elif msg[0] == "mini":
                    _, n, id_carga, imagen = msg
                    if id_carga == self.id_carga:
                        self.mini_cache[n] = imagen
                        if n == self.pagina_vista:
                            self._poner_mini(imagen)
                elif msg[0] == "thumb":
                    _, id_carga, n, imagen = msg
                    if id_carga == self.id_carga and n in self.tarjetas and imagen is not None:
                        foto = ImageTk.PhotoImage(imagen)
                        self.thumbs[n] = foto
                        self.tarjetas[n]["miniatura"].configure(image=foto)
        except queue.Empty:
            pass
        self.raiz.after(100, self._revisar_cola)

    # ---------- aviso final ----------
    def _ocultar_aviso(self):
        self.estadisticas = None
        self.aviso.pack_forget()
        self.marco_detalles.pack_forget()
        self.detalles_abiertos = False
        self.boton_detalles.config(text="Detalles ▾")

    def _pintar_aviso(self):
        e = self.estadisticas
        if not e:
            return
        tiempo = f" · {e['segundos']} s" if e.get("segundos") is not None else ""
        if "error" in e:
            nivel, icono, titulo, detalle = "mal", "error", "No se pudo convertir", e["error"]
        elif e["sin_nada"]:
            nivel, icono, titulo, detalle = "mal", "error", "No se guardó ningún archivo", "; ".join(e["avisos"]) or "Revisa las opciones."
        else:
            nivel, icono = ("aviso", "aviso") if e["avisos"] else ("ok", "ok")
            que = "todas en un solo archivo" if e.get("unido") and e["archivos"] <= 2 else f"{e['archivos']} archivo(s)"
            titulo = f"Listo: {e['paginas']} página(s) convertida(s), {que}{tiempo}"
            detalle = ("A revisar: " + "; ".join(e["avisos"][:4]) + ("…" if len(e["avisos"]) > 4 else "")) if e["avisos"] else "Todo se recuperó sin avisos."
        bg, fg = self._p(nivel + "_bg"), self._p(nivel + "_fg")
        for w in (self.aviso, self.aviso_icono, self.aviso_titulo, self.aviso_detalle, self.aviso_titulo.master, self.aviso_titulo.master.master):
            try:
                w.configure(bg=bg)
            except tk.TclError:
                pass
        self.aviso_titulo.configure(fg=fg, text=titulo, bg=bg)
        self.aviso_detalle.configure(fg=fg, text=detalle, bg=bg)
        self.aviso_icono.configure(image=self._icono(icono, 26), bg=bg)
        self.boton_dwg.state(["!disabled"] if e.get("primer_dwg") else ["disabled"])
        self.boton_carpeta.state(["disabled"] if "error" in e else ["!disabled"])
        self.aviso.pack(fill="x", pady=(8, 0))

    def _alternar_detalles(self):
        self.detalles_abiertos = not self.detalles_abiertos
        if self.detalles_abiertos:
            self.marco_detalles.pack(fill="both", expand=True, pady=(8, 0))
            self.boton_detalles.config(text="Detalles ▴")
        else:
            self.marco_detalles.pack_forget()
            self.boton_detalles.config(text="Detalles ▾")

    def abrir_carpeta(self):
        carpeta = (self.estadisticas or {}).get("carpeta") or (self.ruta.parent if self.ruta else None)
        if carpeta:
            os.startfile(str(carpeta))

    def abrir_dwg(self):
        e = self.estadisticas or {}
        if e.get("primer_dwg") and e.get("carpeta"):
            os.startfile(str(Path(e["carpeta"]) / e["primer_dwg"]))

    # ---------- detalles con colores e iconos ----------
    def _refrescar_resumen(self):
        t = self.resumen
        t.config(state="normal")
        t.delete("1.0", "end")
        for linea in self._texto_resumen.splitlines():
            s = linea.strip()
            if not s:
                t.insert("end", "\n")
                continue
            if s.startswith("Archivo:"):
                self._con_icono(t, "pdf", 16)
                t.insert("end", " " + s + "\n", "titulo")
            elif s.startswith("Página") and "NO convertida" not in s:
                self._con_icono(t, "pdf", 14)
                t.insert("end", " " + s + "\n", "titulo")
            elif "NO convertida" in s or s.startswith("NO se pudo") or s.startswith("No se pudo"):
                self._con_icono(t, "error", 14)
                t.insert("end", " " + s + "\n", "mal")
            elif s.startswith(("NO hay texto", "Se reconocieron", "Avisos", "Aviso")):
                self._con_icono(t, "aviso", 14)
                t.insert("end", " " + s + "\n", "aviso")
            elif s.startswith(("Guardado", "Recuperado", "Capas", "Se corrigieron")):
                self._con_icono(t, "ok", 13)
                t.insert("end", " " + s + "\n", "ok")
            else:
                t.insert("end", "   " + s + "\n", "suave")
        t.config(state="disabled")

    def _con_icono(self, t, tipo, tam):
        t.insert("end", "   ")
        t.image_create("end", image=self._icono(tipo, tam), padx=1)


def main():
    try:  # letras nitidas en pantallas con escala
        import ctypes
        ctypes.windll.shcore.SetProcessDpiAwareness(1)
    except Exception:
        pass
    raiz = TkinterDnD.Tk() if HAY_ARRASTRAR else tk.Tk()
    app = App(raiz)
    if len(sys.argv) > 2 and sys.argv[1] == "--prueba":  # solo para comprobar la pantalla sin usar el raton
        opciones = sys.argv[3:]
        raiz.after(300, lambda: app.cargar(sys.argv[2]))
        raiz.after(900, lambda: (app.var_ocr.set("ocr" in opciones), app.var_unir.set("unir" in opciones),
                                 app._modo_cambiado(), app.var_dxf.set(True), app.var_dwg.set(motor.dxf_a_dwg.disponible())))
        raiz.after(1500, app.convertir)
        raiz.after(1600, lambda: None)
    raiz.mainloop()


if __name__ == "__main__":
    main()
