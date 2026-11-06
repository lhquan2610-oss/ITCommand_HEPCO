// scripts/deep_audit_unidentified.cjs
const { execSync } = require('child_process');
const dns = require('dns');
const http = require('http');

const ips = [
  '10.0.0.6',
  '10.1.1.33',
  '10.1.1.99',
  '10.2.0.191',
  '10.2.1.34',
  '10.2.1.43',
  '10.2.1.52',
  '10.3.1.35',
  '10.11.1.55',
  '10.12.1.66',
  '10.20.1.33',
  '10.30.1.26',
  '10.30.1.36',
  '10.30.1.69'
];

console.log(`==================================================================`);
console.log(` QUÉT CHI TIẾT & ĐỊNH DANH 14 THIẾT BỊ "CHƯA ĐỊNH DANH TÊN"`);
console.log(`==================================================================\n`);

function runPs(cmd) {
  try {
    return execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${cmd}"`, { timeout: 4000 }).toString().trim();
  } catch (e) {
    return null;
  }
}

async function auditIp(ip) {
  console.log(`\n-------------------------------------------------------------`);
  console.log(`[TARGET] Đang quét sâu IP: ${ip}`);

  // 1. Ping
  const pingRes = runPs(`(Test-Connection -ComputerName ${ip} -Count 1 -Quiet)`);
  const isAlive = pingRes === 'True';
  console.log(`  * Ping Status: ${isAlive ? 'ONLINE (Phản hồi tốt)' : 'OFFLINE / Chặn Ping'}`);

  // 2. DNS Reverse Lookup
  let dnsHost = 'N/A';
  try {
    const res = await new Promise((resolve) => dns.reverse(ip, (err, hostnames) => resolve(hostnames ? hostnames[0] : null)));
    if (res) dnsHost = res;
  } catch {}
  console.log(`  * Reverse DNS: ${dnsHost}`);

  // 3. NetBIOS nbtstat
  const nbtOut = runPs(`nbtstat -A ${ip}`);
  let netbiosName = 'N/A';
  let netbiosUser = 'N/A';
  let macFromNbt = 'N/A';

  if (nbtOut) {
    const lines = nbtOut.split('\n');
    for (const line of lines) {
      if (line.includes('<00>') && line.includes('UNIQUE')) {
        const parts = line.trim().split(/\s+/);
        if (parts[0] && netbiosName === 'N/A') netbiosName = parts[0];
      }
      if (line.includes('<03>') && line.includes('UNIQUE')) {
        const parts = line.trim().split(/\s+/);
        if (parts[0]) netbiosUser = parts[0];
      }
      if (line.includes('MAC Address') || line.includes('Địa chỉ MAC')) {
        macFromNbt = line.trim();
      }
    }
  }
  console.log(`  * NetBIOS Hostname: ${netbiosName} | Logged-in User: ${netbiosUser}`);
  if (macFromNbt !== 'N/A') console.log(`  * NetBIOS MAC: ${macFromNbt}`);

  // 4. WMI Query if online
  if (isAlive) {
    const wmiRes = runPs(`
      $opt = New-CimSessionOption -Protocol Dcom
      try {
        $s = New-CimSession -ComputerName '${ip}' -SessionOption $opt -OperationTimeoutSec 2
        $cs = Get-CimInstance Win32_ComputerSystem -CimSession $s | Select-Object Name, UserName, Model, Manufacturer
        $os = Get-CimInstance Win32_OperatingSystem -CimSession $s | Select-Object Caption
        $cpu = Get-CimInstance Win32_Processor -CimSession $s | Select-Object Name
        $mem = Get-CimInstance Win32_PhysicalMemory -CimSession $s | Measure-Object -Property Capacity -Sum
        Remove-CimSession $s
        [PSCustomObject]@{
          Hostname = $cs.Name
          User = $cs.UserName
          Model = ($cs.Manufacturer + ' ' + $cs.Model).Trim()
          OS = $os.Caption
          CPU = $cpu.Name
          RAM = [Math]::Round($mem.Sum / 1GB)
        } | ConvertTo-Json -Compress
      } catch {
        'NO_WMI'
      }
    `);
    if (wmiRes && wmiRes !== 'NO_WMI' && !wmiRes.includes('NO_WMI')) {
      try {
        const wmiData = JSON.parse(wmiRes);
        console.log(`  * WMI Data: Host=${wmiData.Hostname}, User=${wmiData.User}, CPU=${wmiData.CPU}, RAM=${wmiData.RAM}GB, OS=${wmiData.OS}`);
      } catch {
        console.log(`  * WMI Raw: ${wmiRes}`);
      }
    } else {
      console.log(`  * WMI: Không có quyền truy vấn hoặc Defender Firewall chặn port RPC`);
    }

    // 5. Port 80 Web check
    const webTitle = runPs(`
      try {
        $r = Invoke-WebRequest -Uri 'http://${ip}' -TimeoutSec 1.5 -UseBasicParsing
        $r.ParsedHtml.title
      } catch {
        $_.Exception.Message
      }
    `);
    if (webTitle && !webTitle.includes('timed out') && !webTitle.includes('Unable to connect')) {
      console.log(`  * Web HTTP Port 80 Title / Response: ${webTitle.trim()}`);
    }
  }

  return { ip, isAlive, dnsHost, netbiosName, netbiosUser };
}

async function main() {
  for (const ip of ips) {
    await auditIp(ip);
  }
}

main();
