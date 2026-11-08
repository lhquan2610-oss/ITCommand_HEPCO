import { describe, it, expect } from 'vitest';
import { exportComputersToExcel, exportPosDevicesToExcel } from '../utils/excelExportEngine';
import { ComputerDevice } from '../pages/ComputerInventoryPage';
import { PosDevice } from '../services/hepcoApi';

describe('Excel Export Engine', () => {
  it('should reject exporting when the device list is empty', async () => {
    const emptyResult = await exportComputersToExcel([]);
    expect(emptyResult.success).toBe(false);
    expect(emptyResult.error).toContain('Không có thiết bị');

    const emptyPosResult = await exportPosDevicesToExcel([]);
    expect(emptyPosResult.success).toBe(false);
    expect(emptyPosResult.error).toContain('Không có thiết bị');
  });

  it('should generate valid computer Excel export with correct file naming format', async () => {
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
        specs: { cpu: 'Core i5-9400', ram: '8GB DDR4', storage: 'SSD 500GB', year: 2019 }
      }
    ];

    const result = await exportComputersToExcel(mockComputers);
    expect(result.success).toBe(true);
    expect(result.fileName).toMatch(/^Danh_sach_may_tinh_\d{4}-\d{2}-\d{2}\.xlsx$/);
    expect(result.fileSize).toBeGreaterThan(1000);
  });

  it('should generate valid POS Excel export with correct file naming format', async () => {
    const mockPosDevices: PosDevice[] = [
      {
        id: 1,
        asset_code: 'POS-001',
        serial_number: 'V302210001',
        imei: '861234567890123',
        sim_number: '0905123456',
        sim_imei: '8984041234567890',
        telecom_plan: 'ezCom90',
        enterprise: 'BSH',
        region: 'Tuyến Bắc Sông Hương',
        status: 'in_use',
        notes: 'Máy hoạt động tốt',
        assignments: [
          {
            id: 1,
            pos_id: 1,
            employee_id: 10,
            employee_name: 'Nguyễn Văn A',
            assigned_date: '2026-01-15'
          }
        ]
      }
    ];

    const result = await exportPosDevicesToExcel(mockPosDevices);
    expect(result.success).toBe(true);
    expect(result.fileName).toMatch(/^Danh_sach_may_POS_\d{4}-\d{2}-\d{2}\.xlsx$/);
    expect(result.fileSize).toBeGreaterThan(1000);
  });
});
