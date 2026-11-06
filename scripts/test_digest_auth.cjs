const crypto = require('crypto');
const http = require('http');

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

function testDigest(ip, path, user, pass) {
  const req1 = http.get(`http://${ip}${path}`, (res1) => {
    console.log(`[${ip}] Initial status: ${res1.statusCode}`);
    const authHeader = res1.headers['www-authenticate'];
    console.log(`[${ip}] WWW-Authenticate: ${authHeader}`);
    if (!authHeader || !authHeader.includes('Digest')) return;

    const realmMatch = authHeader.match(/realm="([^"]+)"/);
    const nonceMatch = authHeader.match(/nonce="([^"]+)"/);
    const qopMatch = authHeader.match(/qop="([^"]+)"/);

    const realm = realmMatch ? realmMatch[1] : '';
    const nonce = nonceMatch ? nonceMatch[1] : '';
    const qop = qopMatch ? qopMatch[1] : null;

    const ha1 = md5(`${user}:${realm}:${pass}`);
    const ha2 = md5(`GET:${path}`);
    const nc = '00000001';
    const cnonce = 'abcdef01';
    let response;
    if (qop) {
      response = md5(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`);
    } else {
      response = md5(`${ha1}:${nonce}:${ha2}`);
    }

    let authStr = `Digest username="${user}", realm="${realm}", nonce="${nonce}", uri="${path}", response="${response}"`;
    if (qop) authStr += `, qop=${qop}, nc=${nc}, cnonce="${cnonce}"`;

    const req2 = http.get(
      { host: ip, path, headers: { Authorization: authStr } },
      (res2) => {
        console.log(`[${ip}] Digest result: ${res2.statusCode} Content-Type: ${res2.headers['content-type']}`);
        const chunks = [];
        res2.on('data', c => chunks.push(c));
        res2.on('end', () => {
          const totalBytes = Buffer.concat(chunks).length;
          console.log(`[${ip}] Received ${totalBytes} bytes!`);
        });
      }
    );
  });
}

testDigest('10.110.1.55', '/cgi-bin/snapshot.cgi', 'admin', 'admin123');
testDigest('10.110.1.11', '/ISAPI/Streaming/channels/101/picture', 'admin', 'admin123');
