import { describe, it, expect } from 'vitest';
import { PosDevice } from '../services/hepcoApi';

describe('POS Inventory & Lifecycle Business Logic', () => {
  const samplePosList: PosDevice[] = [
    {
      id: 1,
      serial_number: 'V3022001',
      imei: '869001001',
      enterprise: 'BSH',
      status: 'in_use',
      sim_number: '0905111222',
      region: 'Phú Nhuận - Vĩnh Ninh',
      assignments: [
        {
          id: 1,
          pos_id: 1,
          employee_id: 101,
          employee_name: 'Trần Văn Bình',
          assigned_date: '2026-02-01'
        }
      ]
    },
    {
      id: 2,
      serial_number: 'V3022002',
      imei: '869001002',
      enterprise: 'NSH',
      status: 'in_stock',
      sim_number: '0905333444',
      region: 'Kho Nam Sông Hương'
    },
    {
      id: 3,
      serial_number: 'V3022003',
      imei: '869001003',
      enterprise: 'BSH',
      status: 'borrowed',
      sim_number: '0905555666',
      borrowings: [
        {
          id: 1,
          pos_id: 3,
          borrower_name: 'Lê Thị Cúc',
          borrowed_date: '2026-03-01',
          purpose: 'Thu đột xuất lễ hội'
        }
      ]
    },
    {
      id: 4,
      serial_number: 'V3022004',
      imei: '869001004',
      enterprise: 'NSH',
      status: 'broken',
      notes: 'Hỏng màn hình cảm ứng'
    }
  ];

  it('should partition devices correctly by Enterprise (BSH and NSH)', () => {
    const bshList = samplePosList.filter(d => d.enterprise === 'BSH');
    const nshList = samplePosList.filter(d => d.enterprise === 'NSH');

    expect(bshList).toHaveLength(2);
    expect(nshList).toHaveLength(2);
  });

  it('should compute inventory counts accurately by status', () => {
    const inUse = samplePosList.filter(d => d.status === 'in_use').length;
    const inStock = samplePosList.filter(d => d.status === 'in_stock').length;
    const borrowed = samplePosList.filter(d => d.status === 'borrowed').length;
    const broken = samplePosList.filter(d => d.status === 'broken').length;

    expect(inUse).toBe(1);
    expect(inStock).toBe(1);
    expect(borrowed).toBe(1);
    expect(broken).toBe(1);
    expect(inUse + inStock + borrowed + broken).toBe(samplePosList.length);
  });

  it('should extract active employee or borrower correctly', () => {
    // Assigned user
    const pos1 = samplePosList[0];
    const user1 = pos1.assignments?.[0]?.employee_name;
    expect(user1).toBe('Trần Văn Bình');

    // Borrower
    const pos3 = samplePosList[2];
    const borrower = pos3.borrowings?.[0]?.borrower_name;
    expect(borrower).toBe('Lê Thị Cúc');
  });
});
