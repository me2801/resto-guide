$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

$env:SINGLE_SERVICE = "true"
$port = if ($env:PORT) { $env:PORT } else { "3000" }
$env:NEXT_PUBLIC_API_BASE_URL = "http://localhost:$port"

Write-Host "==> Building API"
Set-Location (Join-Path $root "api")
npm ci
npm run build

Write-Host "==> Building mobile app"
Set-Location (Join-Path $root "frontend")
npm ci
npm run build

Write-Host "==> Building web app"
Set-Location (Join-Path $root "frontend-desktop")
npm ci
npm run build
