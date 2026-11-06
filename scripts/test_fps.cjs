const http = require('http');
const crypto = require('crypto');

function md5(s) {
  return crypto.createHash('md5').update(s).digest('hex');
}

function getSnap(ip, path, user, pass) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    http.get('http://' + ip + path, (r1) => {
      const auth = r1.headers['www-authenticate'];
      if (!auth) return resolve({ time: Date.now() - t0, code: r1.statusCode });
      const realm = (auth.match(/realm="([^"]+)"/) || [])[1] || '';
      const nonce = (auth.match(/nonce="([^"]+)"/) || [])[1] || '';
      const ha1 = md5(user + ':' + realm + ':' + pass);
      const ha2 = md5('GET:' + path);
      const resp = md5(ha1 + ':' + nonce + ':' + ha2);
      const header = 'Digest username="' + user + '", realm="' + realm + '", nonce="' + nonce + '", uri="' + path + '", response="' + resp + '"';
      http.get({ host: ip, path, headers: { Authorization: header } }, (r2) => {
        let b = 0;
        r2.on('data', c => b += c.length);
        r2.on('end', () => resolve({ time: Date.now() - t0, bytes: b, status: r2.statusCode }));
      }).on('error', e => resolve({ error: e.message }));
    }).on('error', e => resolve({ error: e.message }));
  });
}

async function test() {
  console.log('Testing 3 frames on NVR 1:');
  for (let i = 0; i < 3; i++) {
    const res = await getSnap('10.110.1.13', '/ISAPI/Streaming/channels/101/picture', 'admin', 'hepco@12@12');
    console.log('Frame', i, res);
  }

  console.log('Testing 3 frames on NVR 2:');
  for (let i = 0; i < 3; i++) {
    const res = await getSnap('10.110.1.80', '/ISAPI/Streaming/channels/101/picture', 'admin', '@dmin123');
    console.log('Frame', i, res);
  }
}

test();
