# Live Comprehensive Network Scan & Device Classification for HEPCO LAN (hepco.com.vn)
$ErrorActionPreference = "SilentlyContinue"

Write-Host "================================================================="
Write-Host " [HICC] BAT DAU QUET & KIEM TRA TOAN BO MANG LAN HEPCO..."
Write-Host "================================================================="

# 1. Subnets defined in HEPCO network
$subnets = @(
    "10.0.0",
    "10.1.0", "10.1.1",
    "10.2.0", "10.2.1",
    "10.3.0", "10.3.1",
    "10.11.1",
    "10.12.1",
    "10.20.1",
    "10.30.1",
    "10.40.1",
    "10.110.1",
    "192.168.1",
    "198.162.101"
)

$allIps = New-Object System.Collections.Generic.List[string]
foreach ($s in $subnets) {
    for ($i = 1; $i -le 254; $i++) {
        $allIps.Add("$s.$i")
    }
}

Write-Host "-> Dang sweep song song $($allIps.Count) dia chi IP tren $($subnets.Count) dai mang..."
$pingBag = [System.Collections.Concurrent.ConcurrentBag[object]]::new()
$batchSize = 512

for ($offset = 0; $offset -lt $allIps.Count; $offset += $batchSize) {
    $end = [Math]::Min($offset + $batchSize - 1, $allIps.Count - 1)
    $batch = $allIps[$offset..$end]
    $tasks = foreach ($ip in $batch) {
        $p = New-Object System.Net.NetworkInformation.Ping
        [PSCustomObject]@{
            IP = $ip
            Ping = $p
            Task = $p.SendPingAsync($ip, 300)
        }
    }
    foreach ($t in $tasks) {
        try {
            $res = $t.Task.GetAwaiter().GetResult()
            if ($res.Status -eq 'Success') {
                $pingBag.Add([PSCustomObject]@{ IP = $t.IP; RTT = $res.RoundtripTime })
            }
        } catch {}
        $t.Ping.Dispose()
    }
}

$pingResults = @{}
foreach ($item in $pingBag) {
    $pingResults[$item.IP] = $item.RTT
}
Write-Host "-> Phat hien $($pingResults.Count) IP phan hoi Ping truc tiep."

# 2. Collect ARP Table
$arpNeighbors = Get-NetNeighbor -AddressFamily IPv4 | Where-Object {
    $_.State -ne 'Unreachable' -and $_.State -ne 'Permanent' -and $_.LinkLayerAddress -and $_.LinkLayerAddress -ne '00-00-00-00-00-00'
}

$discovered = @{}
foreach ($a in $arpNeighbors) {
    $ip = $a.IPAddress
    if ($ip -notlike "169.254.*" -and $ip -notlike "224.*" -and $ip -notlike "239.*" -and $ip -ne "255.255.255.255") {
        $discovered[$ip] = [PSCustomObject]@{
            IP = $ip
            MAC = $a.LinkLayerAddress.ToUpper()
            ARPState = [string]$a.State
            PingReply = $pingResults.ContainsKey($ip)
            RTT = if ($pingResults.ContainsKey($ip)) { $pingResults[$ip] } else { $null }
        }
    }
}

foreach ($ip in $pingResults.Keys) {
    if (-not $discovered.ContainsKey($ip)) {
        $discovered[$ip] = [PSCustomObject]@{
            IP = $ip
            MAC = ""
            ARPState = "Reachable"
            PingReply = $true
            RTT = $pingResults[$ip]
        }
    }
}

# Local Machine
$discovered["10.1.1.45"] = [PSCustomObject]@{
    IP = "10.1.1.45"
    MAC = "C0-25-A5-96-66-7A"
    ARPState = "LocalMachine"
    PingReply = $true
    RTT = 0
}

Write-Host "-> Tong so IP hoat dong ghi nhan tren LAN: $($discovered.Count) IP."

# 3. Fast TCP Probe key services on active hosts
Write-Host "-> Dang quet cong dich vu (9100, 515, 554, 8000, 37777, 445, 3389, 80, 443, 53, 22)..."
$portsToProbe = @(22, 53, 80, 443, 445, 515, 554, 3389, 8000, 9100, 37777)
$probeResults = @{}

$pool = [runspacefactory]::CreateRunspacePool(1, 30)
$pool.Open()
$jobs = @()

$probeBlock = {
    param($targetIp, $ports)
    $open = New-Object System.Collections.Generic.List[int]
    foreach ($p in $ports) {
        $tcp = New-Object System.Net.Sockets.TcpClient
        try {
            $ar = $tcp.BeginConnect($targetIp, $p, $null, $null)
            if ($ar.AsyncWaitHandle.WaitOne(150, $false)) {
                $tcp.EndConnect($ar)
                $open.Add($p)
            }
        } catch {}
        $tcp.Close()
    }
    [PSCustomObject]@{ IP = $targetIp; OpenPorts = ($open -join ",") }
}

foreach ($item in $discovered.Values) {
    $ps = [powershell]::Create().AddScript($probeBlock).AddArgument($item.IP).AddArgument($portsToProbe)
    $ps.RunspacePool = $pool
    $jobs += [PSCustomObject]@{ PS = $ps; Handle = $ps.BeginInvoke() }
}

foreach ($j in $jobs) {
    $res = $j.PS.EndInvoke($j.Handle)
    if ($res) {
        $probeResults[$res[0].IP] = $res[0].OpenPorts
    }
    $j.PS.Dispose()
}
$pool.Close()
$pool.Dispose()

# 4. Export Live Scan to JSON for HICC Command Center
$exportList = New-Object System.Collections.Generic.List[object]
foreach ($item in $discovered.Values) {
    $open = if ($probeResults.ContainsKey($item.IP)) { $probeResults[$item.IP] } else { "" }
    $exportList.Add([PSCustomObject]@{
        IP = $item.IP
        MAC = $item.MAC
        ARPState = $item.ARPState
        PingReply = $item.PingReply
        RTT = $item.RTT
        OpenPorts = $open
    })
}

$exportPath = Join-Path $PSScriptRoot "..\data_live_scan.json"
$exportList | ConvertTo-Json -Depth 3 | Set-Content -Path $exportPath -Encoding UTF8

Write-Host "-> Da luu ket qua quet live vao data_live_scan.json."
