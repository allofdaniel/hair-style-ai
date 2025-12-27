# LookSim - Build AAB Script for Google Play Store
Write-Host "=== Building LookSim AAB ===" -ForegroundColor Cyan

# Set environment
$env:JAVA_HOME = "C:\Android\jdk-21.0.2"
$env:ANDROID_SDK_ROOT = "C:\Android\Sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_SDK_ROOT\platform-tools;$env:PATH"

# Navigate to android directory
$androidDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $androidDir

Write-Host "Working directory: $androidDir" -ForegroundColor Yellow

# Check if keystore exists
$keystorePath = "app\looksim.keystore"
if (-not (Test-Path $keystorePath)) {
    Write-Host "`nKeystore not found! Creating new keystore..." -ForegroundColor Yellow
    & "$env:JAVA_HOME\bin\keytool.exe" -genkey -v -keystore "app\looksim.keystore" -alias looksim -keyalg RSA -keysize 2048 -validity 10000 -storepass "looksim2024!" -keypass "looksim2024!" -dname "CN=LookSim, OU=App, O=LookSim, L=Seoul, ST=Seoul, C=KR"

    if (-not (Test-Path $keystorePath)) {
        Write-Host "Failed to create keystore!" -ForegroundColor Red
        exit 1
    }
    Write-Host "Keystore created successfully!" -ForegroundColor Green
}

# Clean and build
Write-Host "`nCleaning previous build..." -ForegroundColor Yellow
.\gradlew.bat clean

Write-Host "`nBuilding Release AAB..." -ForegroundColor Yellow
.\gradlew.bat bundleRelease

# Check result
$aabPath = "app\build\outputs\bundle\release\app-release.aab"
if (Test-Path $aabPath) {
    $fileInfo = Get-Item $aabPath
    Write-Host "`n=== BUILD SUCCESS ===" -ForegroundColor Green
    Write-Host "AAB Location: $($fileInfo.FullName)" -ForegroundColor Green
    Write-Host "Size: $([math]::Round($fileInfo.Length / 1MB, 2)) MB" -ForegroundColor Green

    # Copy to easy location with version
    $outputDir = "..\release"
    if (-not (Test-Path $outputDir)) {
        New-Item -ItemType Directory -Path $outputDir | Out-Null
    }

    $timestamp = Get-Date -Format "yyyyMMdd-HHmm"
    $outputFile = "$outputDir\looksim-v1.0.0-$timestamp.aab"
    Copy-Item $aabPath $outputFile
    Write-Host "Copied to: $outputFile" -ForegroundColor Cyan

    Write-Host "`n=== NEXT STEPS ===" -ForegroundColor Magenta
    Write-Host "1. Go to Google Play Console: https://play.google.com/console" -ForegroundColor White
    Write-Host "2. Create new app 'LookSim'" -ForegroundColor White
    Write-Host "3. Upload the AAB file" -ForegroundColor White
    Write-Host "4. Fill in store listing (title, description, screenshots)" -ForegroundColor White
    Write-Host "5. Set content rating" -ForegroundColor White
    Write-Host "6. Set pricing (free)" -ForegroundColor White
    Write-Host "7. Submit for review" -ForegroundColor White
} else {
    Write-Host "`n=== BUILD FAILED ===" -ForegroundColor Red
    Write-Host "AAB file not found at: $aabPath" -ForegroundColor Red
    Write-Host "Check the build logs above for errors" -ForegroundColor Yellow
}
