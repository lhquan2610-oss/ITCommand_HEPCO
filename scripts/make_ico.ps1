Add-Type -AssemblyName System.Drawing

$pngPath = "F:\LinhTinh\APP_TuPhatTrien\HEPCO-IT-COMMAND-CENTER\frontend\public\hepco-logo.png"
$buildDir = "F:\LinhTinh\APP_TuPhatTrien\HEPCO-IT-COMMAND-CENTER\frontend\build"
$icoPath = "$buildDir\icon.ico"

if (-not (Test-Path $buildDir)) {
    New-Item -ItemType Directory -Force -Path $buildDir | Out-Null
}

$bmp = [System.Drawing.Bitmap]::FromFile($pngPath)
$resized = New-Object System.Drawing.Bitmap(256, 256)
$g = [System.Drawing.Graphics]::FromImage($resized)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.DrawImage($bmp, 0, 0, 256, 256)

$hIcon = $resized.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)

$stream = New-Object System.IO.FileStream($icoPath, [System.IO.FileMode]::Create)
$icon.Save($stream)
$stream.Close()

Copy-Item $icoPath "F:\LinhTinh\APP_TuPhatTrien\HEPCO-IT-COMMAND-CENTER\frontend\electron\icon.ico" -Force
Copy-Item $pngPath "$buildDir\icon.png" -Force

Write-Host "Created icon.ico successfully at: $icoPath"
