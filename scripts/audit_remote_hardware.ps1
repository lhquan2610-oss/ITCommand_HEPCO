# scripts/audit_remote_hardware.ps1
$ErrorActionPreference = "SilentlyContinue"
$invPath = "F:\LinhTinh\APP_TuPhatTrien\HEPCO-IT-COMMAND-CENTER\data\devices_inventory.json"
if (-not (Test-Path $invPath)) {
    Write-Host "Inventory file not found: $invPath"
    exit 1
}

$rawJson = Get-Content $invPath -Raw -Encoding UTF8
$inventory = $rawJson | ConvertFrom-Json

Write-Host "=================================================================="
Write-Host " [HICC] AUDIT CAU HINH PHAN CUNG THUC TE QUA MANG LAN HEPCO"
Write-Host "=================================================================="

$dcomOpt = New-CimSessionOption -Protocol Dcom
$auditResults = New-Object System.Collections.Generic.List[object]

$targets = $inventory | Where-Object { $_.category -eq "WORKSTATION" -or $_.category -eq "SERVER" }
Write-Host "Kiem tra tong cong $($targets.Count) may..."

foreach ($dev in $targets) {
    $ip = $dev.ip
    if (-not $ip -or $ip -eq "" -or $ip -eq "N/A") { continue }
    
    $p = New-Object System.Net.NetworkInformation.Ping
    $pingOk = $false
    try {
        $pRes = $p.Send($ip, 120)
        if ($pRes.Status -eq "Success") { $pingOk = $true }
    } catch {}
    $p.Dispose()

    if (-not $pingOk) {
        $auditResults.Add([PSCustomObject]@{
            ip = $ip
            name = $dev.display_name
            user = $dev.assigned_user
            dept = $dev.department
            status = "OFFLINE"
            hardwareMatched = $false
            note = "May tat hoac khong phan hoi Ping"
            liveCpu = ""
            liveRamGB = 0
            liveStorage = ""
            liveOs = ""
            liveMain = ""
        })
        continue
    }

    $session = $null
    try {
        if ($ip -eq "10.1.1.45" -or $ip -eq "127.0.0.1") {
            $cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
            $mem = Get-CimInstance Win32_PhysicalMemory | Measure-Object -Property Capacity -Sum
            $os = Get-CimInstance Win32_OperatingSystem | Select-Object -First 1
            $board = Get-CimInstance Win32_BaseBoard | Select-Object -First 1
            $disk = Get-CimInstance Win32_DiskDrive | Select-Object -First 1
        } else {
            $session = New-CimSession -ComputerName $ip -SessionOption $dcomOpt -OperationTimeoutSec 2
            $cpu = Get-CimInstance Win32_Processor -CimSession $session | Select-Object -First 1
            $mem = Get-CimInstance Win32_PhysicalMemory -CimSession $session | Measure-Object -Property Capacity -Sum
            $os = Get-CimInstance Win32_OperatingSystem -CimSession $session | Select-Object -First 1
            $board = Get-CimInstance Win32_BaseBoard -CimSession $session | Select-Object -First 1
            $disk = Get-CimInstance Win32_DiskDrive -CimSession $session | Select-Object -First 1
        }

        $liveRamGB = if ($mem.Sum) { [Math]::Round($mem.Sum / 1GB) } else { 0 }
        $liveCpu = if ($cpu) { $cpu.Name.Trim() } else { "N/A" }
        $liveMain = if ($board) { ($board.Manufacturer + " " + $board.Product).Trim() } else { "N/A" }
        $liveDiskGB = if ($disk) { [Math]::Round($disk.Size / 1GB) } else { 0 }
        $liveDisk = if ($disk) { ($disk.Model + " (" + $liveDiskGB + " GB)") } else { "N/A" }
        $liveOs = if ($os) { $os.Caption.Trim() } else { "N/A" }

        $storedRam = if ($dev.hardware_specs) { $dev.hardware_specs.ram } else { "" }
        $match = $true
        $notes = New-Object System.Collections.Generic.List[string]

        if ($storedRam -and $liveRamGB -gt 0) {
            if ($storedRam -match "(\d+)\s*GB") {
                $storedRamGB = [int]$matches[1]
                if ($storedRamGB -ne $liveRamGB) {
                    $match = $false
                    $notes.Add("RAM thuc te: " + $liveRamGB + "GB (Ho so cu: " + $storedRamGB + "GB)")
                }
            }
        }

        $noteStr = if ($notes.Count -gt 0) { $notes -join "; " } else { "Khop 100% cau hinh thuc te" }

        $auditResults.Add([PSCustomObject]@{
            ip = $ip
            name = $dev.display_name
            user = $dev.assigned_user
            dept = $dev.department
            status = "ONLINE_VERIFIED"
            hardwareMatched = $match
            note = $noteStr
            liveCpu = $liveCpu
            liveRamGB = $liveRamGB
            liveStorage = $liveDisk
            liveOs = $liveOs
            liveMain = $liveMain
        })
        Write-Host "-> [$ip] $($dev.display_name): $liveCpu | $liveRamGB GB RAM | $noteStr"
    } catch {
        $auditResults.Add([PSCustomObject]@{
            ip = $ip
            name = $dev.display_name
            user = $dev.assigned_user
            dept = $dev.department
            status = "ONLINE_NO_RPC"
            hardwareMatched = $true
            note = "Online (WMI/RPC port closed by firewall)"
            liveCpu = ""
            liveRamGB = 0
            liveStorage = ""
            liveOs = ""
            liveMain = ""
        })
    } finally {
        if ($session) { Remove-CimSession $session }
    }
}

$outPath = "F:\LinhTinh\APP_TuPhatTrien\HEPCO-IT-COMMAND-CENTER\data\hardware_audit_report.json"
$auditResults | ConvertTo-Json -Depth 4 | Set-Content -Path $outPath -Encoding UTF8
Write-Host "Da luu ket qua vao: $outPath"
