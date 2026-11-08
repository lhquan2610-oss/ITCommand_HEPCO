import { describe, it, expect } from 'vitest';

describe('Traffic Anomaly & Network Spike Monitoring Logic', () => {
  interface TrafficSample {
    downloadMbps: number;
    uploadMbps: number;
    broadcastPps: number;
  }

  interface Thresholds {
    enabled: boolean;
    downloadMbps: number;
    uploadMbps: number;
    broadcastPps: number;
    spikeMultiplier: number;
  }

  const checkTrafficAnomaly = (
    current: TrafficSample,
    baselineAvg: number,
    thresholds: Thresholds
  ) => {
    if (!thresholds.enabled) {
      return { isAnomaly: false, reason: null, severity: null };
    }

    if (current.downloadMbps >= thresholds.downloadMbps) {
      return {
        isAnomaly: true,
        reason: `Lưu lượng tải xuống đột biến (${current.downloadMbps.toFixed(1)} Mbps >= ${thresholds.downloadMbps} Mbps)`,
        severity: 'CRITICAL'
      };
    }

    if (current.uploadMbps >= thresholds.uploadMbps) {
      return {
        isAnomaly: true,
        reason: `Lưu lượng tải lên cao bất thường (${current.uploadMbps.toFixed(1)} Mbps >= ${thresholds.uploadMbps} Mbps)`,
        severity: 'WARNING'
      };
    }

    if (current.broadcastPps >= thresholds.broadcastPps) {
      return {
        isAnomaly: true,
        reason: `Bão gói tin Broadcast/ARP (${current.broadcastPps} pkts/s)`,
        severity: 'CRITICAL'
      };
    }

    if (baselineAvg > 0 && current.downloadMbps >= baselineAvg * thresholds.spikeMultiplier) {
      return {
        isAnomaly: true,
        reason: `Băng thông tăng đột biến gấp ${(current.downloadMbps / baselineAvg).toFixed(1)} lần mức nền`,
        severity: 'WARNING'
      };
    }

    return { isAnomaly: false, reason: null, severity: null };
  };

  it('should suppress any anomaly alerts when thresholds are disabled (Default user preference)', () => {
    const thresholds: Thresholds = {
      enabled: false,
      downloadMbps: 50,
      uploadMbps: 30,
      broadcastPps: 600,
      spikeMultiplier: 3.5
    };

    const extremeSpike: TrafficSample = {
      downloadMbps: 120,
      uploadMbps: 85,
      broadcastPps: 1500
    };

    const res = checkTrafficAnomaly(extremeSpike, 10, thresholds);
    expect(res.isAnomaly).toBe(false);
  });

  it('should detect critical download surge when enabled', () => {
    const thresholds: Thresholds = {
      enabled: true,
      downloadMbps: 50,
      uploadMbps: 30,
      broadcastPps: 600,
      spikeMultiplier: 3.5
    };

    const surgeSample: TrafficSample = {
      downloadMbps: 75.4,
      uploadMbps: 12,
      broadcastPps: 120
    };

    const res = checkTrafficAnomaly(surgeSample, 15, thresholds);
    expect(res.isAnomaly).toBe(true);
    expect(res.severity).toBe('CRITICAL');
    expect(res.reason).toContain('tải xuống đột biến');
  });

  it('should detect broadcast/ARP storm exceeding packet threshold', () => {
    const thresholds: Thresholds = {
      enabled: true,
      downloadMbps: 50,
      uploadMbps: 30,
      broadcastPps: 600,
      spikeMultiplier: 3.5
    };

    const stormSample: TrafficSample = {
      downloadMbps: 15,
      uploadMbps: 5,
      broadcastPps: 850
    };

    const res = checkTrafficAnomaly(stormSample, 10, thresholds);
    expect(res.isAnomaly).toBe(true);
    expect(res.severity).toBe('CRITICAL');
    expect(res.reason).toContain('Bão gói tin Broadcast');
  });
});
