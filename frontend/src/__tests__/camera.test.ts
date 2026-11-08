import { describe, it, expect } from 'vitest';

describe('Camera Live Stream & NVR Configuration', () => {
  const NVR_CREDS = {
    '10.110.1.13': { user: 'admin', pass: 'admin123', name: 'NVR Văn Phòng Trung Tâm' },
    '10.110.1.80': { user: 'admin', pass: 'admin123', name: 'NVR Trạm Hương Sơ' },
    '113.161.8.149': { user: 'admin', pass: 'philonghue123', name: 'Camera Bãi Rác (BaiRac)' }
  };

  it('should construct correct RTSP stream URL for Bãi Rác Dahua NetSDK channel', () => {
    const bairacIp = '113.161.8.149';
    const channel = 1;
    const creds = NVR_CREDS[bairacIp];

    const rtspUrl = `rtsp://${creds.user}:${creds.pass}@${bairacIp}:554/cam/realmonitor?channel=${channel}&subtype=0`;

    expect(rtspUrl).toBe('rtsp://admin:philonghue123@113.161.8.149:554/cam/realmonitor?channel=1&subtype=0');
    expect(rtspUrl).toContain('philonghue123');
    expect(rtspUrl).toContain('113.161.8.149:554');
  });

  it('should map Bãi Rác online channels properly (ch 0 to ch 4 online, ch 5 and 6 offline)', () => {
    const bairacChannels = [
      { ch: 0, name: 'Ch.01', label: 'Bai rac', isOnline: true },
      { ch: 1, name: 'Ch.02', label: 'san ho xu ly', isOnline: true },
      { ch: 2, name: 'Ch.03', label: 'he txl', isOnline: true },
      { ch: 3, name: 'Ch.04', label: 'san xn', isOnline: true },
      { ch: 4, name: 'Ch.05', label: 'cau rua xe', isOnline: true },
      { ch: 5, name: 'Ch.06', label: 'Kênh6', isOnline: false },
      { ch: 6, name: 'Ch.07', label: 'Quan trac khi', isOnline: false }
    ];

    const online = bairacChannels.filter(c => c.isOnline);
    const offline = bairacChannels.filter(c => !c.isOnline);

    expect(online).toHaveLength(5);
    expect(offline).toHaveLength(2);
    expect(online.map(c => c.label)).toEqual(['Bai rac', 'san ho xu ly', 'he txl', 'san xn', 'cau rua xe']);
  });
});
