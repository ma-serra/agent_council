# Enable Everything HTTP Server - porta 8080
# Rodar como Administrador no Windows PowerShell

$iniPath = "$env:APPDATA\Everything\Everything.ini"

if (-not (Test-Path $iniPath)) {
    Write-Host "Everything.ini nao encontrado em: $iniPath"
    Write-Host "Tentando localizar Everything..."
    $iniPath = "$env:LOCALAPPDATA\Everything\Everything.ini"
}

if (Test-Path $iniPath) {
    $content = Get-Content $iniPath -Raw

    # Habilitar HTTP server
    if ($content -match "http_server_enabled=") {
        $content = $content -replace "http_server_enabled=\d", "http_server_enabled=1"
    } else {
        $content += "`nhttp_server_enabled=1"
    }

    # Definir porta 8080
    if ($content -match "http_server_port=") {
        $content = $content -replace "http_server_port=\d+", "http_server_port=8080"
    } else {
        $content += "`nhttp_server_port=8080"
    }

    Set-Content $iniPath $content -Encoding UTF8
    Write-Host "HTTP server habilitado na porta 8080"
} else {
    Write-Host "Configurando via argumentos de linha de comando..."
}

# Reiniciar Everything
Stop-Process -Name "Everything" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

$everythingPaths = @(
    "C:\Program Files\Everything\Everything.exe",
    "C:\Program Files (x86)\Everything\Everything.exe",
    "$env:LOCALAPPDATA\Programs\Everything\Everything.exe"
)

foreach ($path in $everythingPaths) {
    if (Test-Path $path) {
        Start-Process $path
        Write-Host "Everything iniciado: $path"
        break
    }
}

Write-Host ""
Write-Host "Pronto! Acesse via:"
Write-Host "  http://localhost:8080/?s=BUSCA&json=1"
Write-Host "  http://localhost:8080/?s=artefato&regex=1&json=1"
Write-Host ""
Write-Host "Compartilhe seu IP local para busca remota:"
(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" }).IPAddress
