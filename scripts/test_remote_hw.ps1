$opt = New-CimSessionOption -Protocol Dcom
$target = "10.0.0.1"
try {
    $s = New-CimSession -ComputerName $target -SessionOption $opt -OperationTimeoutSec 3
    $cpu = Get-CimInstance Win32_Processor -CimSession $s | Select-Object -First 1
    Write-Host "Success via DCOM on $target! CPU: $($cpu.Name)"
    Remove-CimSession $s
} catch {
    Write-Host "DCOM failed: $($_.Exception.Message)"
}

try {
    $targetHost = "DSERVER.hepco.com.vn"
    $cpu = Get-CimInstance Win32_Processor -ComputerName $targetHost -OperationTimeoutSec 3 | Select-Object -First 1
    Write-Host "Success via Hostname $targetHost! CPU: $($cpu.Name)"
} catch {
    Write-Host "Hostname failed: $($_.Exception.Message)"
}
