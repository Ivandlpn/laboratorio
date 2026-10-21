<#
 Copia la documentacion de Kntera a este repositorio, sin tocar el original.

 Uso (desde cualquier carpeta):
   .\sincronizar-documentacion.ps1            copia y deja los cambios sin subir
   .\sincronizar-documentacion.ps1 -Subir     copia, hace commit y push

 - El original vive en el equipo de trabajo y se sigue editando alli.
 - Se copian README.md, CLAUDE.md e INVENTARIO-CAPTURAS.md. No se copian las capturas de pantalla
   (son de una app de terceros) ni el codigo.
 - Los parrafos que contienen datos personales se sustituyen por un aviso. Ademas, si existe el archivo
   local .bloqueo-local.txt (en la raiz del repositorio, ignorado por git; un nombre o frase por linea),
   cualquier parrafo que contenga alguno de esos terminos tambien se omite, y si aun asi quedara alguno,
   el script se detiene sin escribir nada.
#>
param(
  [string]$Origen = "C:\Users\ivan_\Desktop\Claude App\Kntera",
  [switch]$Subir
)
$ErrorActionPreference = "Stop"
$aqui = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = (git -C $aqui rev-parse --show-toplevel).Trim()
$destino = Join-Path $aqui "documentacion"
$utf8 = New-Object System.Text.UTF8Encoding($false)

$bloqueo = Join-Path $repo ".bloqueo-local.txt"
$terminos = @()
if (Test-Path $bloqueo) { $terminos = Get-Content $bloqueo -Encoding UTF8 | Where-Object { $_.Trim() } }
$marcadores = @("**Datos personales en la web publicada.**") + $terminos
$aviso = "> *(Parrafo omitido en la copia publica del repositorio: contenia datos personales.)*"

$omitidos = 0
function Limpiar([string]$texto) {
  $texto = $texto -replace "`r`n", "`n"
  $bloques = $texto -split "`n`n"
  for ($i = 0; $i -lt $bloques.Count; $i++) {
    foreach ($m in $marcadores) {
      if ($bloques[$i].IndexOf($m, [StringComparison]::OrdinalIgnoreCase) -ge 0) {
        $bloques[$i] = $aviso
        $script:omitidos++
        break
      }
    }
  }
  return ($bloques -join "`n`n")
}

$salida = @{}
foreach ($nombre in "README.md", "CLAUDE.md", "INVENTARIO-CAPTURAS.md") {
  $ruta = Join-Path $Origen $nombre
  if (-not (Test-Path $ruta)) { Write-Warning "No encuentro $ruta"; continue }
  $texto = Limpiar ([IO.File]::ReadAllText($ruta, $utf8))
  foreach ($t in $terminos) {
    if ($texto.IndexOf($t, [StringComparison]::OrdinalIgnoreCase) -ge 0) { throw "Quedo '$t' en $nombre; no se escribe nada." }
  }
  $cabecera = "<!-- Copia automatica de la documentacion de Kntera ($(Get-Date -Format 'yyyy-MM-dd')). El original se edita en el equipo de trabajo; no edites esta copia. -->`n`n"
  $salida[$nombre] = $cabecera + $texto
}
New-Item -ItemType Directory -Force $destino | Out-Null
foreach ($k in $salida.Keys) { [IO.File]::WriteAllText((Join-Path $destino $k), $salida[$k], $utf8) }
"Copiados: $($salida.Keys -join ', ') · parrafos omitidos: $omitidos"

if ($Subir) {
  git -C $repo add proyectos/kntera
  git -C $repo diff --cached --quiet
  if ($LASTEXITCODE -eq 0) { "Sin cambios que subir."; return }
  git -C $repo commit -m "Actualizar la documentacion de Kntera"
  git -C $repo push
}
