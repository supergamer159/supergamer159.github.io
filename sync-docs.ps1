$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$docs = Join-Path $root "docs"

New-Item -ItemType Directory -Force -Path $docs | Out-Null

$itemsToSync = @(
  "index.html",
  "styles.css",
  "game",
  "2D Pixel Dungeon Asset Pack",
  "Enemy_Animations_Set"
)

$staleItems = @(
  "script.js"
)

foreach ($item in $staleItems) {
  $stalePath = Join-Path $docs $item
  if (Test-Path $stalePath) {
    Remove-Item $stalePath -Recurse -Force
  }
}

foreach ($item in $itemsToSync) {
  $source = Join-Path $root $item
  $destination = Join-Path $docs $item

  if (Test-Path $destination) {
    Remove-Item $destination -Recurse -Force
  }

  Copy-Item $source -Destination $docs -Recurse -Force
}

if (-not (Test-Path (Join-Path $docs ".nojekyll"))) {
  New-Item -ItemType File -Path (Join-Path $docs ".nojekyll") | Out-Null
}

Write-Host "docs/ has been refreshed for GitHub Pages."
