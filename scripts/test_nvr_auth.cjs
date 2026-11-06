const http = require('http');
const crypto = require('crypto');

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

function testNvrAuth(ip, user, pass) {
  return new Promise((resolve) => {
    const req1 = http.get(`http://${ip}/ISAPI/System/deviceInfo`, (res1) => {
      const authHeader = res1.headers['www-authenticate'];
      if (!authHeader) {
        return resolve({ ip, success: false, msg: 'No auth header' });
      }
      const realmMatch = authHeader.match(/realm="([^"]+)"/);
      const nonceMatch = authHeader.match(/nonce="([^"]+)"/);
      const qopMatch = authHeader.match(/qop="([^"]+)"/);

      if (!realmMatch || !nonceMatch) {
        return resolve({ ip, success: false, msg: 'Cannot parse digest' });
      }

      const realm = realmMatch[1];
      const nonce = nonceMatch[1];
      const qop = qopMatch ? qopMatch[1] : null;
      const uri = '/ISAPI/System/deviceInfo';
      const method = 'GET';

      const ha1 = md5(`${user}:${realm}:${pass}`);
      const ha2 = md5(`${method}:${uri}`);
      let headerStr;

      if (qop) {
        const cnonce = '0a4f113b';
        const nc = '00000001';
        const response = md5(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`);
        headerStr = `Digest username="${user}", realm="${realm}", nonce="${nonce}", uri="${uri}", qop=${qop}, nc=${nc}, cnonce="${cnonce}", response="${response}"`;
      } else {
        const response = md5(`${ha1}:${nonce}:${ha2}`);
        headerStr = `Digest username="${user}", realm="${realm}", nonce="${nonce}", uri="${uri}", response="${response}"`;
      }

      const req2 = http.request({
        host: ip,
        port: 80,
        path: uri,
        method: 'GET',
        headers: { 'Authorization': headerStr }
      }, (res2) => {
        let body = '';
        res2.on('data', c => body += c);
        res2.on('end', () => {
          resolve({ ip, statusCode: res2.statusCode, success: res2.statusCode === 200, bodySnippet: body.slice(0, 300) });
        });
      });
      req2.on('error', e => resolve({ ip, success: false, error: e.message }));
      req2.end();
    });
    req1.on('error', e => resolve({ ip, success: false, error: e.message }));
  });
}

async function run() {
  console.log('Testing NVR 1 (10.110.1.13) with admin / hepco@12@12 ...');
  const r1 = await testNvrAuth('10.110.1.13', 'admin', 'hepco@12@12');
  console.log('Result NVR 1:', r1);

  console.log('\nTesting NVR 2 (10.110.1.80) with admin / @dmin123 ...');
  const r2 = await testNvrAuth('10.110.1.80', 'admin', '@dmin123');
  console.log('Result NVR 2:', r2);
}

run();
