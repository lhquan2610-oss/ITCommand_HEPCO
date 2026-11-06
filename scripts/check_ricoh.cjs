const net = require('net');
const http = require('http');

function checkPort(host, port, timeout = 1200) {
  return new Promise((resolve) => {
    const s = new net.Socket();
    s.setTimeout(timeout);
    s.once('connect', () => { s.destroy(); resolve(true); });
    s.once('timeout', () => { s.destroy(); resolve(false); });
    s.once('error', () => { s.destroy(); resolve(false); });
    s.connect(port, host);
  });
}

function fetchHttp(host, port = 80) {
  return new Promise((resolve) => {
    const req = http.get(`http://${host}:${port}/`, { timeout: 1500 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, bodySnippet: data.slice(0, 300) }));
    });
    req.on('error', (err) => resolve({ error: err.message }));
    req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }); });
  });
}

async function run() {
  const ports = [80, 443, 515, 631, 9100, 135, 445, 3389];
  for (const host of ['10.1.1.17', '10.1.1.18']) {
    console.log(`\n=== Testing ${host} ===`);
    for (const p of ports) {
      const open = await checkPort(host, p);
      if (open) console.log(`  Port ${p} is OPEN`);
    }
    const web = await fetchHttp(host);
    console.log(`  HTTP check:`, web.status ? `Status ${web.status}, Server: ${web.headers.server}` : web.error);
    if (web.bodySnippet) console.log(`  Snippet:`, web.bodySnippet.replace(/\s+/g, ' '));
  }
}

run();
