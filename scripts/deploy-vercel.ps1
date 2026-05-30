param(
  [Parameter(Mandatory = $true, HelpMessage = "Backend URL, e.g. https://kalon-api.onrender.com")]
  [string]$ApiUrl
)

$ErrorActionPreference = "Stop"
$ApiUrl = $ApiUrl.TrimEnd("/")

Write-Host "Building frontend with API: $ApiUrl" -ForegroundColor Cyan
$env:VITE_API_URL = "$ApiUrl/api"
$env:VITE_SOCKET_URL = $ApiUrl

Set-Location "$PSScriptRoot\..\frontend"
npm run build

Write-Host "Deploying to Vercel..." -ForegroundColor Cyan
vercel deploy --prod --yes

Write-Host "Done! Open the URL shown above." -ForegroundColor Green
