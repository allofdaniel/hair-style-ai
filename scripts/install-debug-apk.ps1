param(
  [switch] $WaitForDevice = $false,
  [string] $ApkPath = "$PSScriptRoot\..\android\app\build\outputs\apk\debug/app-debug.apk"
)

$ErrorActionPreference = 'Stop'

$candidates = @(
  "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe",
  'C:\Android\Sdk\platform-tools\adb.exe',
  "$env:APPDATA\..\..\Android\Sdk\platform-tools\adb.exe"
)

$adbPath = $candidates | ForEach-Object { if (Test-Path $_) { $_ } }
if (-not $adbPath -or -not $adbPath.Count) {
  throw 'ADB executable not found. Install Android SDK platform-tools and set path.'
}
$adbPath = $adbPath[0]

if (-not (Test-Path $ApkPath)) {
  throw "APK not found: $ApkPath. Run 'npm run build' and 'npx cap sync android' first."
}

function Get-ConnectedDevice {
  $raw = & $adbPath devices | Where-Object {
    $_ -match '^\S+\t(device|unauthorized|offline)$'
  }

  $devices = @()
  foreach ($line in $raw) {
    if ($line -match '^([^\s]+)\t(device|unauthorized|offline)$') {
      $devices += [pscustomobject]@{
        Serial = $matches[1]
        State  = $matches[2]
      }
    }
  }
  return $devices
}

$devices = Get-ConnectedDevice
if ($devices.Count -eq 0) {
  if (-not $WaitForDevice) {
    throw 'No USB devices found. Connect phone and run with -WaitForDevice'
  }

  while ($devices.Count -eq 0) {
    Write-Host 'Waiting for USB device...'
    Start-Sleep -Seconds 2
    $devices = Get-ConnectedDevice
  }
}

$ready = $devices | Where-Object { $_.State -eq 'device' }
if ($ready.Count -eq 0) {
  $states = $devices | ForEach-Object { "$($_.Serial):$($_.State)" }
  throw "Connected devices are not ready. States: $($states -join ', ')"
}

$serial = $ready[0].Serial
Write-Host "Installing APK to $serial ..."
& $adbPath -s $serial install -r $ApkPath
if ($LASTEXITCODE -ne 0) {
  throw 'ADB install failed.'
}

Write-Host "Install complete: $ApkPath"
