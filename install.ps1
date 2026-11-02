param(
  [string]$Repo = "https://github.com/Simon-Kuo/dsh-sync-ui.git",
  [string]$Dest = "$env:USERPROFILE\Documents\deepseek-harness\default-workspace\plugins\dsh-sync-ui"
)
$ErrorActionPreference = "Stop"
if (Test-Path (Join-Path $Dest ".git")) {
  git -C $Dest pull --ff-only
} else {
  New-Item -ItemType Directory -Force -Path (Split-Path $Dest) | Out-Null
  git clone $Repo $Dest
}
Write-Host ""
Write-Host "Plugin downloaded to: $Dest"
Write-Host "Now ask the DSH Agent to run:"
Write-Host "plugin_manager install_bundle target `"$Dest`""
Write-Host ""
Write-Host "Then restart Harness and open 'Cross-machine sync' in the sidebar."
