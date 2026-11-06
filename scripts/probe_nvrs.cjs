const http = require('http');

// Check ISAPI on NVR 1 (10.110.1.13) and NVR 2 (10.110.1.80)
async function probeNvr(ip) {
  return new Promise((resolve) => {
    const req = http.request({
      host: ip,
      port: 80,
      path: '/ISAPI/System/deviceInfo',
      method: 'GET',
      timeout: 3000
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          ip,
          statusCode: res.statusCode,
          authHeader: res.headers['www-authenticate'],
          server: res.headers['server'],
          bodySnippet: body.slice(0, 200)
        });
      });
    });
    req.on('error', (err) => resolve({ ip, error: err.message }));
    req.on('timeout', () => { req.destroy(); resolve({ ip, error: 'timeout' }); });
    req.end();
  });
}

async function run() {
  console.log('--- Probing NVR 1 & NVR 2 ---');
  const r1 = await probeNvr('10.110.1.13');
  console.log('NVR 1 (10.110.1.13):', r1);
  const r2 = await probeNvr('10.110.1.80');
  console.log('NVR 2 (10.110.1.80):', r2);
}

run();
