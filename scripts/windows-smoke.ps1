$ErrorActionPreference = "Stop"

$installer = Get-ChildItem -Path "dist" -Filter "Jetflix Setup *.exe" |
  Where-Object { $_.Name -notmatch "__uninstaller" } |
  Select-Object -First 1

if (-not $installer) {
  throw "Windows installer was not produced"
}

$installDir = Join-Path $env:LOCALAPPDATA "Programs\Jetflix"
$appExe = Join-Path $installDir "Jetflix.exe"

Write-Host "Installing $($installer.Name) silently"
$install = Start-Process -FilePath $installer.FullName -ArgumentList "/S" -PassThru -Wait
if ($install.ExitCode -ne 0) {
  throw "NSIS installer exited with code $($install.ExitCode)"
}
if (-not (Test-Path $appExe)) {
  throw "Installer completed but $appExe does not exist"
}

Write-Host "Launching installed Jetflix app"
$app = Start-Process -FilePath $appExe -PassThru
Start-Sleep -Seconds 12
$app.Refresh()
if ($app.HasExited) {
  throw "Installed Jetflix exited during startup with code $($app.ExitCode)"
}

Write-Host "PASS installed Jetflix stayed running (PID $($app.Id))"
Stop-Process -Id $app.Id -Force

$uninstaller = Join-Path $installDir "Uninstall Jetflix.exe"
if (Test-Path $uninstaller) {
  $uninstall = Start-Process -FilePath $uninstaller -ArgumentList "/S" -PassThru -Wait
  if ($uninstall.ExitCode -ne 0) {
    throw "NSIS uninstaller exited with code $($uninstall.ExitCode)"
  }
}
