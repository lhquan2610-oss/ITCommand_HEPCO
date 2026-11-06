import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Default configuration for HEPCO Live API
const DEFAULT_API_BASE = 'https://hepco-api.vercel.app/api';
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = '123456';

// Storage keys
const TOKEN_KEY = 'hicc_hepco_api_token';
const TOKEN_TIME_KEY = 'hicc_hepco_api_token_time';
const CONFIG_KEY = 'hicc_hepco_api_config';
const BASE_TOKEN_KEY = 'hicc_base_token';

// Default Base.vn Token v2 provided for Base Office integration
export const DEFAULT_BASE_TOKEN = '9386~gzfdETEYyd_VFMhi0_wQSihiJZCBZhHNdmHKbAQK_F9V12TPF7n3FESm6p-s4hkQXbllQy2isFU6KQ-jyrGYh16nEj9l-S86GQaMqWJbsqMgC174A8gfiHHBB7K4FiUZyUPoGCdCT21KucZs1M0zZvPlidec2-KrsyIjyGl1usc';

export const getBaseToken = (): string => {
  try {
    const saved = localStorage.getItem(BASE_TOKEN_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch {}
  return DEFAULT_BASE_TOKEN;
};

export const saveBaseToken = (token: string) => {
  localStorage.setItem(BASE_TOKEN_KEY, token.trim());
};

export interface HepcoApiConfig {
  baseUrl: string;
  username: string;
  password: string;
}

export const getHepcoApiConfig = (): HepcoApiConfig => {
  try {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) {
      return { ...JSON.parse(saved) };
    }
  } catch {}
  return {
    baseUrl: DEFAULT_API_BASE,
    username: DEFAULT_USERNAME,
    password: DEFAULT_PASSWORD,
  };
};

export const saveHepcoApiConfig = (cfg: HepcoApiConfig) => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  // Invalidate token to force re-login with new config
  localStorage.removeItem(TOKEN_KEY);
};

// Create axios instance
export const hepcoClient: AxiosInstance = axios.create({
  baseURL: getHepcoApiConfig().baseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

let isLoggingIn = false;
let loginWaiters: Array<(token: string) => void> = [];

// Login helper
export const loginHepcoApi = async (username?: string, password?: string): Promise<string> => {
  const cfg = getHepcoApiConfig();
  const u = username || cfg.username;
  const p = password || cfg.password;

  const res = await axios.post(`${cfg.baseUrl}/login`, { username: u, password: p }, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (res.data?.success && res.data?.token) {
    const token = res.data.token;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_TIME_KEY, String(Date.now()));
    hepcoClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return token;
  }
  throw new Error(res.data?.message || 'Đăng nhập API HEPCO thất bại');
};

// Request interceptor to attach JWT Token
hepcoClient.interceptors.request.use(async (config) => {
  const cfg = getHepcoApiConfig();
  config.baseURL = cfg.baseUrl;

  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    if (!isLoggingIn) {
      isLoggingIn = true;
      try {
        token = await loginHepcoApi();
        loginWaiters.forEach((cb) => cb(token!));
        loginWaiters = [];
      } catch (err) {
        loginWaiters = [];
        return Promise.reject(err);
      } finally {
        isLoggingIn = false;
      }
    } else {
      // Wait for existing login
      token = await new Promise<string>((resolve) => {
        loginWaiters.push(resolve);
      });
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Attach Base.vn Token v2 for Base Office endpoints
  const baseToken = getBaseToken();
  if (baseToken) {
    config.headers['x-base-token'] = baseToken;
  }
  return config;
});

// Response interceptor to auto re-login on 401/403 Token Expired
hepcoClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      (error.response.status === 401 ||
        (error.response.status === 403 && error.response.data?.errorCode === 'TOKEN_MISSING')) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      localStorage.removeItem(TOKEN_KEY);
      try {
        const newToken = await loginHepcoApi();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return hepcoClient(originalRequest);
      } catch (loginErr) {
        return Promise.reject(loginErr);
      }
    }
    return Promise.reject(error);
  }
);

// -------------------------------------------------------------
// POS DATA INTERFACES
// -------------------------------------------------------------
export interface PosAssignment {
  id: number;
  pos_id: number;
  employee_id: number;
  employee_name: string;
  assigned_date: string;
  returned_date?: string | null;
  assigned_by?: string;
  region?: string;
  note?: string;
  employee?: {
    id: number;
    employee_code: string;
    full_name: string;
    position?: string;
    phone?: string;
    department?: {
      id: number;
      code: string;
      name: string;
    };
  };
}

export interface PosBorrowing {
  id: number;
  pos_id: number;
  borrower_name: string;
  employee_id?: number;
  borrowed_date?: string;
  expected_return_date?: string;
  returned_date?: string | null;
  purpose?: string;
  note?: string;
}

export interface PosDevice {
  id: number;
  asset_code?: string | null;
  serial_number: string;
  imei: string;
  sim_number?: string | null;
  sim_imei?: string | null;
  telecom_plan?: string | null;
  enterprise: 'BSH' | 'NSH' | string;
  department_id?: number | null;
  region?: string | null;
  status: 'in_stock' | 'in_use' | 'borrowed' | 'broken' | 'retired' | string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  assignments?: PosAssignment[];
  borrowings?: PosBorrowing[];
}

export interface PosStats {
  total: number;
  BSH: number;
  NSH: number;
  in_stock: number;
  in_use: number;
  borrowed: number;
  broken: number;
  retired: number;
}

export interface PosApiResponse {
  data: PosDevice[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    stats: PosStats;
  };
}

export interface EmployeeItem {
  id: number;
  employee_code: string;
  full_name: string;
  department_id: number;
  position?: string;
  employee_type: number; // 1: Fee Collector, 2: Office
  email?: string;
  phone?: string;
  status: number;
  department?: {
    id: number;
    code: string;
    name: string;
  };
}

export interface PosPaperItem {
  id: number;
  paper_name: string;
  code?: string;
  total_quantity: number;
  in_stock_quantity: number;
  issued_quantity: number;
  unit_price?: number;
  supplier_name?: string;
  notes?: string;
}

export interface PosPaperIssueRecord {
  id: number;
  paper_id: number;
  employee_id: number;
  quantity: number;
  issue_date: string;
  issued_by?: string;
  note?: string;
  employee?: {
    id: number;
    employee_code: string;
    full_name: string;
  };
  paper?: {
    id: number;
    paper_name: string;
  };
}

// =============================================================
// BASE.VN / BASE OFFICE INTERFACES
// =============================================================
export interface BaseOfficeHealth {
  connected: boolean;
  message: string;
  mode: string;
  token_preview: string;
}

export interface DispatchItem {
  id: string;
  code?: string;
  title: string;
  type: 'incoming' | 'outgoing' | 'internal' | string;
  sender?: string;
  receiver?: string;
  status: '0' | '1' | 'pending' | 'completed' | string;
  urgency?: 'normal' | 'high' | 'urgent' | string;
  created_at?: string;
  file_name?: string;
  file_url?: string;
  description?: string;
}

export interface BaseRequestItem {
  id: string;
  code?: string;
  title: string;
  category?: string;
  creator?: string;
  status: string;
  created_at?: string;
  amount?: string;
}

export interface BaseTaskItem {
  id: string;
  title: string;
  project?: string;
  assignee?: string;
  due_date?: string;
  status?: string;
}

// -------------------------------------------------------------
// HEPCO API METHODS
// -------------------------------------------------------------
export const HepcoApiService = {
  // Health
  async checkHealth() {
    const cfg = getHepcoApiConfig();
    const res = await axios.get(`${cfg.baseUrl}/health`, { timeout: 5000 });
    return res.data;
  },

  // POS Devices
  async getPosDevices(params: {
    search?: string;
    enterprise?: string;
    status?: string;
    region?: string;
    department_id?: number;
    page?: number;
    limit?: number;
    sort?: string;
  } = {}): Promise<PosApiResponse> {
    const res = await hepcoClient.get('/pos', { params });
    return res.data;
  },

  async getPosDetail(id: number): Promise<PosDevice> {
    const res = await hepcoClient.get(`/pos/${id}`);
    return res.data;
  },

  async createPos(payload: {
    serial_number: string;
    imei: string;
    sim_number?: string;
    sim_imei?: string;
    telecom_plan?: string;
    enterprise: string;
    region?: string;
    status?: string;
    notes?: string;
  }) {
    const res = await hepcoClient.post('/pos', payload);
    return res.data;
  },

  async updatePos(id: number, payload: Partial<PosDevice>) {
    const res = await hepcoClient.put(`/pos/${id}`, payload);
    return res.data;
  },

  async deletePos(id: number) {
    const res = await hepcoClient.delete(`/pos/${id}`);
    return res.data;
  },

  // POS Lifecycle Actions
  async assignPos(posId: number, payload: {
    employee_id: number;
    employee_name?: string;
    region?: string;
    assigned_by?: string;
    assigned_date: string;
    note?: string;
  }) {
    const res = await hepcoClient.post(`/pos/${posId}/assign`, payload);
    return res.data;
  },

  async unassignPos(posId: number, payload: {
    returned_date: string;
    note?: string;
  }) {
    const res = await hepcoClient.post(`/pos/${posId}/unassign`, payload);
    return res.data;
  },

  async borrowPos(posId: number, payload: {
    borrower_name: string;
    employee_id?: number;
    expected_return_date?: string;
    purpose?: string;
    note?: string;
  }) {
    const res = await hepcoClient.post(`/pos/${posId}/borrow`, payload);
    return res.data;
  },

  async returnBorrowPos(posId: number, payload: {
    note?: string;
  }) {
    const res = await hepcoClient.post(`/pos/${posId}/return-borrow`, payload);
    return res.data;
  },

  async getPosHistory(posId: number): Promise<{ assignments: PosAssignment[]; borrowings: PosBorrowing[] }> {
    const res = await hepcoClient.get(`/pos/${posId}/history`);
    return res.data;
  },

  // Employees for assignment
  async getEmployees(params: {
    employee_type?: number;
    search?: string;
    status?: number;
    limit?: number;
  } = {}): Promise<{ data: EmployeeItem[]; meta: any }> {
    const res = await hepcoClient.get('/employees', { params: { limit: 200, ...params } });
    return res.data;
  },

  // Departments
  async getDepartments() {
    const res = await hepcoClient.get('/departments', { params: { limit: 100 } });
    return res.data;
  },

  // POS Paper
  async getPosPaper(): Promise<{ data: PosPaperItem[]; meta: any }> {
    const res = await hepcoClient.get('/pos-paper');
    return res.data;
  },

  async createPosPaper(payload: {
    paper_name: string;
    code?: string;
    total_quantity: number;
    unit_price?: number;
    supplier_name?: string;
    notes?: string;
  }) {
    const res = await hepcoClient.post('/pos-paper', payload);
    return res.data;
  },

  async issuePosPaper(payload: {
    paper_id: number;
    employee_id: number;
    quantity: number;
    issue_date: string;
    issued_by?: string;
    note?: string;
  }) {
    const res = await hepcoClient.post('/pos-paper/issue', payload);
    return res.data;
  },

  async getPosPaperIssues(): Promise<{ data: PosPaperIssueRecord[]; meta: any }> {
    const res = await hepcoClient.get('/pos-paper/issues');
    return res.data;
  },

  // ===========================================================
  // BASE OFFICE (QUẢN LÝ CÔNG VĂN BASE.VN)
  // ===========================================================
  async getBaseOfficeHealth(): Promise<{ data: BaseOfficeHealth }> {
    const res = await hepcoClient.get('/base-office/health');
    return res.data;
  },

  async getDispatches(params: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    status?: string;
  } = {}): Promise<{ data: DispatchItem[]; meta: any }> {
    const res = await hepcoClient.get('/base-office/dispatches', { params: { limit: 50, ...params } });
    return res.data;
  },

  async getDispatchDetail(id: string): Promise<{ data: DispatchItem }> {
    const res = await hepcoClient.get(`/base-office/dispatches/${id}`);
    return res.data;
  },

  async createDispatch(payload: {
    title: string;
    type: string;
    sender?: string;
    receiver?: string;
    content?: string;
    urgency?: string;
  }): Promise<any> {
    const res = await hepcoClient.post('/base-office/dispatches', payload);
    return res.data;
  },

  async getBaseRequests(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  } = {}): Promise<{ data: BaseRequestItem[]; meta?: any }> {
    const res = await hepcoClient.get('/base-office/requests', { params: { limit: 50, ...params } });
    return res.data;
  },

  async getBaseTasks(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  } = {}): Promise<{ data: BaseTaskItem[]; meta?: any }> {
    const res = await hepcoClient.get('/base-office/tasks', { params: { limit: 50, ...params } });
    return res.data;
  },
};
