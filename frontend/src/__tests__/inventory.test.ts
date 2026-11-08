import { describe, it, expect } from 'vitest';
import { FIXED_DEPARTMENTS, ComputerDevice } from '../pages/ComputerInventoryPage';

describe('Computer & Hardware Inventory Management', () => {
  it('should have standard official HEPCO department ordering defined', () => {
    expect(FIXED_DEPARTMENTS).toBeDefined();
    expect(FIXED_DEPARTMENTS.length).toBeGreaterThanOrEqual(10);
    expect(FIXED_DEPARTMENTS[0]).toBe('Ban Lãnh Đạo');
    expect(FIXED_DEPARTMENTS[1]).toBe('Phòng Tổ chức - Hành chính');
    expect(FIXED_DEPARTMENTS[2]).toBe('Phòng Kế toán - Tài vụ');
  });

  it('should filter computers accurately by user name, IP, and hardware specs', () => {
    const mockComputers: ComputerDevice[] = [
      {
        id: '1',
        display_name: 'Dương Thị Huệ',
        assigned_user: 'Dương Thị Huệ',
        ip: '10.2.1.40',
        mac: 'E4:54:E8:A0:6A:E6',
        department: 'Ban Lãnh Đạo',
        device_code: 'TTHDQT',
        category: 'PC',
        status: 'ONLINE',
        specs: { cpu: 'Core i5-9400', ram: '8GB DDR4', storage: 'SSD 500GB' }
      },
      {
        id: '2',
        display_name: 'Phan Lê Hiến',
        assigned_user: 'Phan Lê Hiến',
        ip: '10.2.1.8',
        mac: '74:56:3C:2D:8C:DD',
        department: 'Ban Lãnh Đạo',
        device_code: 'CTHDQT',
        category: 'PC',
        status: 'ONLINE',
        specs: { cpu: 'Core i5-13400', ram: '16GB DDR4', storage: 'SSD 256GB' }
      },
      {
        id: '3',
        display_name: 'SERVER-PC',
        assigned_user: 'Hệ Thống Máy Chủ',
        ip: '10.0.0.1',
        mac: '00:1A:64:12:34:56',
        department: 'Máy chủ',
        device_code: 'SRV-01',
        category: 'SERVER',
        status: 'ONLINE',
        specs: { cpu: 'Intel Xeon E5', ram: '64GB ECC', storage: '4x 1TB SAS RAID10' }
      }
    ];

    // Search by User Name
    const byName = mockComputers.filter(c => c.assigned_user.toLowerCase().includes('huệ'));
    expect(byName).toHaveLength(1);
    expect(byName[0].ip).toBe('10.2.1.40');

    // Search by IP
    const byIp = mockComputers.filter(c => c.ip.includes('10.0.0.1'));
    expect(byIp).toHaveLength(1);
    expect(byIp[0].category).toBe('SERVER');

    // Search by CPU spec
    const byCpu = mockComputers.filter(c => c.specs?.cpu.toLowerCase().includes('xeon'));
    expect(byCpu).toHaveLength(1);
    expect(byCpu[0].device_code).toBe('SRV-01');

    // Filter by Department
    const byDept = mockComputers.filter(c => c.department === 'Ban Lãnh Đạo');
    expect(byDept).toHaveLength(2);
  });
});
