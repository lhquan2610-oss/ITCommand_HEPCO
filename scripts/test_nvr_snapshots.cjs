const http = require('http');
const crypto = require('crypto');

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

function fetchSnap(ip, path, user, pass) {
  return new Promise((resolve) => {
    http.get(`http://${ip}${path}`, (res1) => {
      if (res1.statusCode === 200) {
        return resolve({ ip, success: true, code: 200, msg: 'Direct 200 OK' });
      }
      const auth = res1.headers['www-authenticate'];
      if (!auth) return resolve({ ip, success: false, code: res1.statusCode, msg: 'No auth' });

      const realm = (auth.match(/realm="([^"]+)"/) || [])[1] || '';
      const nonce = (auth.match(/nonce="([^"]+)"/) || [])[1] || '';
      const qop = (auth.match(/qop="([^"]+)"/) || [])[1];
      const opaque = (auth.match(/opaque="([^"]+)"/) || [])[1];

      const ha1 = md5(`${user}:${realm}:${pass}`);
      const ha2 = md5(`GET:${path}`);
      const nc = '00000001';
      const cnonce = 'abcdef01';
      const resp = qop
        ? md5(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`)
        : md5(`${ha1}:${nonce}:${ha2}`);

      let authHeader = `Digest username="${user}", realm="${realm}", nonce="${nonce}", uri="${path}", response="${resp}"`;
      if (qop) authHeader += `, qop=${qop}, nc=${nc}, cnonce="${cnonce}"`;
      if (opaque) authHeader += `, opaque="${opaque}"`;

      http.get({ host: ip, path, headers: { Authorization: authHeader } }, (res2) => {
        let len = 0;
        res2.on('data', c => len += c.length);
        res2.on('end', () => {
          resolve({ ip, success: res2.statusCode === 200, code: res2.statusCode, bytes: len });
        });
      }).on('error', e => resolve({ ip, error: e.message }));
    }).on('error', e => resolve({ ip, error: e.message }));
  });
}

async function run() {
  console.log('Testing snapshot NVR 1 ch101 (10.110.1.13)...');
  const s1 = await fetchSnap('10.110.1.13', '/ISAPI/Streaming/channels/101/picture', 'admin', 'hepco@12@12');
  console.log('Snap NVR 1:', s1);

  console.log('Testing snapshot NVR 2 ch101 (10.110.1.80)...');
  const s2 = await fetchSnap('10.110.1.80', '/ISAPI/Streaming/channels/101/picture', 'admin', '@dmin123');
  console.log('Snap NVR 2:', s2);
}

run();
