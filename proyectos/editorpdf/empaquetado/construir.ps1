# Construye PDF_a_DWG.zip (sin ODA File Converter) a partir del codigo de ../app
$ErrorActionPreference = "Stop"
$aqui = Split-Path -Parent $MyInvocation.MyCommand.Path
$app = Join-Path $aqui "..\app"
$salida = Join-Path $aqui "salida"
$trabajo = Join-Path $aqui "build"
Remove-Item $salida, $trabajo -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $salida | Out-Null

python -m pip install pyinstaller | Out-Null
python -m PyInstaller --noconfirm --clean --onedir --windowed --name PDF_a_DWG `
  --icon (Join-Path $aqui "icono.ico") --paths $app `
  --distpath (Join-Path $salida "dist") --workpath $trabajo --specpath $trabajo `
  --collect-all tkinterdnd2 --collect-data sv_ttk --collect-submodules winrt `
  --hidden-import ocr_letras --hidden-import sv_ttk --hidden-import tkinterdnd2 `
  --exclude-module matplotlib --exclude-module scipy --exclude-module pandas --exclude-module IPython `
  --exclude-module notebook --exclude-module pytest --exclude-module sphinx --exclude-module PyQt5 `
  --exclude-module PyQt6 --exclude-module PySide6 --exclude-module wx --exclude-module torch `
  --exclude-module tensorflow --exclude-module numba --exclude-module sklearn --exclude-module lxml `
  (Join-Path $app "app.py")

$paquete = Join-Path $salida "paquete"
New-Item -ItemType Directory -Force $paquete | Out-Null
Copy-Item (Join-Path $salida "dist\PDF_a_DWG") (Join-Path $paquete "PDF_a_DWG") -Recurse
Get-ChildItem (Join-Path $paquete "PDF_a_DWG\_internal\cv2") -Filter "opencv_videoio_ffmpeg*.dll" -ErrorAction SilentlyContinue | Remove-Item -Force
Copy-Item (Join-Path $aqui "LEEME.txt") $paquete
Compress-Archive -Path "$paquete\*" -DestinationPath (Join-Path $salida "PDF_a_DWG.zip") -CompressionLevel Optimal
"Listo: $(Join-Path $salida 'PDF_a_DWG.zip')"
