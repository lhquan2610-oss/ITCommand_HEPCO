Add-Type -AssemblyName System.Drawing

$src = "F:\LinhTinh\APP_TuPhatTrien\HEPCO-IT-COMMAND-CENTER\frontend\public\hepco-logo.png"
$bmp = [System.Drawing.Bitmap]::FromFile($src)
$outBmp = New-Object System.Drawing.Bitmap(512, 512)
$g = [System.Drawing.Graphics]::FromImage($outBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.DrawImage($bmp, 0, 0, 512, 512)
$g.Dispose()
$bmp.Dispose()

$dst = "F:\LinhTinh\APP_TuPhatTrien\HEPCO-IT-COMMAND-CENTER\frontend\src\assets\hepco-logo.png"
$outBmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
$outBmp.Dispose()

$len = (Get-Item $dst).Length
Write-Host "Optimized logo to: $len bytes"
