Add-Type -AssemblyName System.Drawing

$src = "C:\Users\lhquan.HEPCO\.gemini\antigravity\brain\b050b093-6507-4ee3-813b-38af30295d88\.user_uploaded\media_1793890755096_3ef6fec2.jpg"
$bmp = [System.Drawing.Bitmap]::FromFile($src)

# 1. 512x512 PNG
$out512 = New-Object System.Drawing.Bitmap(512, 512)
$g = [System.Drawing.Graphics]::FromImage($out512)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)
$g.DrawImage($bmp, 0, 0, 512, 512)
$g.Dispose()

$paths = @(
    "F:\LinhTinh\APP_TuPhatTrien\HEPCO-IT-COMMAND-CENTER\frontend\public\hepco-logo.png",
    "F:\LinhTinh\APP_TuPhatTrien\HEPCO-IT-COMMAND-CENTER\frontend\src\assets\hepco-logo.png",
    "F:\LinhTinh\APP_TuPhatTrien\HEPCO-IT-COMMAND-CENTER\frontend\electron\icon.png",
    "F:\LinhTinh\APP_TuPhatTrien\HEPCO-IT-COMMAND-CENTER\frontend\build\icon.png"
)

foreach ($p in $paths) {
    $dir = Split-Path $p
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    $out512.Save($p, [System.Drawing.Imaging.ImageFormat]::Png)
}
$out512.Dispose()

# 2. 256x256 ICO
$out256 = New-Object System.Drawing.Bitmap(256, 256)
$g2 = [System.Drawing.Graphics]::FromImage($out256)
$g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g2.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g2.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g2.DrawImage($bmp, 0, 0, 256, 256)
$g2.Dispose()

$hIcon = $out256.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)

$icoBuild = "F:\LinhTinh\APP_TuPhatTrien\HEPCO-IT-COMMAND-CENTER\frontend\build\icon.ico"
$icoElectron = "F:\LinhTinh\APP_TuPhatTrien\HEPCO-IT-COMMAND-CENTER\frontend\electron\icon.ico"

$stream1 = New-Object System.IO.FileStream($icoBuild, [System.IO.FileMode]::Create)
$icon.Save($stream1)
$stream1.Close()

$stream2 = New-Object System.IO.FileStream($icoElectron, [System.IO.FileMode]::Create)
$icon.Save($stream2)
$stream2.Close()

$out256.Dispose()
$bmp.Dispose()

Write-Host "New HEPCO logo successfully converted and saved to PNG and ICO!"
