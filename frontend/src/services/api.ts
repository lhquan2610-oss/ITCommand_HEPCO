import axios from 'axios';
import { DashboardSummary, Device, AlertItem, ScanJobItem, SubnetItem } from '../types';

const API_BASE = '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const res = await apiClient.get('/dashboard/summary');
  return res.data;
};

export const getStatusDistribution = async () => {
  const res = await apiClient.get('/dashboard/status-distribution');
  return res.data.distribution;
};

export const getRecentActivity = async () => {
  const res = await apiClient.get('/dashboard/recent-activity');
  return res.data;
};

export const getDevices = async (params: {
  search?: string;
  device_type?: string;
  status?: string;
  department_id?: string;
  page?: number;
  limit?: number;
}) => {
  const res = await apiClient.get('/devices', { params });
  return res.data;
};

export const updateDeviceManagement = async (
  deviceId: string,
  payload: {
    device_code?: string;
    display_name?: string;
    device_type_code?: string;
    lock_device_type?: boolean;
    department_id?: string;
    assigned_user?: string;
    location?: string;
    notes?: string;
    is_authorized?: boolean;
  }
) => {
  const res = await apiClient.patch(`/devices/${deviceId}/management`, payload);
  return res.data;
};

export const lookupIp = async (ip: string) => {
  const res = await apiClient.get(`/lookup/ip/${ip}`);
  return res.data;
};

export const lookupMac = async (mac: string) => {
  const res = await apiClient.get(`/lookup/mac/${mac}`);
  return res.data;
};

export const getAlerts = async (params?: { status?: string; severity?: string; page?: number; limit?: number }) => {
  const res = await apiClient.get('/alerts', { params });
  return res.data;
};

export const acknowledgeAlert = async (alertId: string, note?: string) => {
  const res = await apiClient.post(`/alerts/${alertId}/acknowledge`, { note });
  return res.data;
};

export const resolveAlert = async (alertId: string, resolution_note: string) => {
  const res = await apiClient.post(`/alerts/${alertId}/resolve`, { resolution_note });
  return res.data;
};

export const getSubnets = async (): Promise<{ data: SubnetItem[] }> => {
  const res = await apiClient.get('/subnets');
  return res.data;
};

export const getScans = async (page = 1, limit = 20): Promise<{ data: ScanJobItem[]; meta: any }> => {
  const res = await apiClient.get('/scans', { params: { page, limit } });
  return res.data;
};

export const getTopology = async () => {
  const res = await apiClient.get('/topology');
  return res.data;
};

export const getDepartments = async () => {
  const res = await apiClient.get('/departments');
  return res.data;
};

export const getDeviceTypes = async () => {
  const res = await apiClient.get('/device-types');
  return res.data;
};

export const getSettings = async () => {
  const res = await apiClient.get('/settings');
  return res.data;
};
