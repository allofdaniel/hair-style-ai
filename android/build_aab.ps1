# HairStyle AI - Build AAB Script
Write-Host "=== Building HairStyle AI AAB ===" -ForegroundColor Cyan

# Set environment
$env:JAVA_HOME = "C:\Android\jdk-21.0.2"
$env:ANDROID_SDK_ROOT = "C:\Android\Sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_SDK_ROOT\platform-tools;$env:PATH"

# Navigate to android directory
$androidDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $androidDir

Write-Host "Working directory: $androidDir" -ForegroundColor Yellow

# Clean and build
Write-Host "Cleaning previous build..." -ForegroundColor Yellow
.\gradlew.bat clean

Write-Host "Building Release AAB..." -ForegroundColor Yellow
.\gradlew.bat bundleRelease

# Check result
$aabPath = "app\build\outputs\bundle\release\app-release.aab"
if (Test-Path $aabPath) {
    $fileInfo = Get-Item $aabPath
    Write-Host "`n=== BUILD SUCCESS ===" -ForegroundColor Green
    Write-Host "AAB Location: $($fileInfo.FullName)" -ForegroundColor Green
    Write-Host "Size: $([math]::Round($fileInfo.Length / 1MB, 2)) MB" -ForegroundColor Green

    # Copy to easy location
    $outputDir = "..\release"
    if (-not (Test-Path $outputDir)) {
        New-Item -ItemType Directory -Path $outputDir | Out-Null
    }
    Copy-Item $aabPath "$outputDir\hairstyle-ai-v1.0.aab"
    Write-Host "Copied to: $outputDir\hairstyle-ai-v1.0.aab" -ForegroundColor Cyan
} else {
    Write-Host "`n=== BUILD FAILED ===" -ForegroundColor Red
    Write-Host "AAB file not found at: $aabPath" -ForegroundColor Red
}
