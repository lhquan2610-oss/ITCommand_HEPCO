import { describe, it, expect } from 'vitest';
import { ALL_FEATURES, DEFAULT_USER_PERMISSIONS } from '../context/SecurityContext';
import { FeatureKey } from '../types/electron';

describe('Security & Role-Based Access Control Policy', () => {
  it('should have standard corporate features and permissions declared', () => {
    expect(ALL_FEATURES).toBeDefined();
    expect(ALL_FEATURES.length).toBeGreaterThanOrEqual(10);
    expect(DEFAULT_USER_PERMISSIONS.length).toBeGreaterThan(0);

    const adminUser = DEFAULT_USER_PERMISSIONS.find(u => u.role === 'admin');
    expect(adminUser).toBeDefined();
    expect(adminUser?.ip).toBe('10.1.1.45');
    expect(adminUser?.name).toContain('Lê Hồng Quân');
  });

  it('should grant full feature access to administrator', () => {
    const adminUser = DEFAULT_USER_PERMISSIONS.find(u => u.role === 'admin');
    const requiredFeatures: FeatureKey[] = [
      'dashboard', 'traffic', 'computers', 'printers', 'cameras',
      'pos', 'dispatches', 'switches', 'lookup', 'network-map',
      'tracking', 'settings'
    ];

    requiredFeatures.forEach(feat => {
      expect(adminUser?.allowedFeatures).toContain(feat);
    });
  });

  it('should support scoped feature permissions for departmental users', () => {
    const customUser = DEFAULT_USER_PERMISSIONS.find(u => u.role === 'custom');
    expect(customUser).toBeDefined();
    expect(customUser?.allowedFeatures).toContain('cameras');
    expect(customUser?.allowedFeatures).not.toContain('settings');
    expect(customUser?.allowedFeatures).not.toContain('traffic');
  });
});
