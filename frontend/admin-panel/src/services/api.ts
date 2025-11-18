import axios from 'axios';

// Obtener URL del backend desde variables de entorno o usar relativa
const getApiBaseURL = () => {
  // En producción, usar variable de entorno
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // En desarrollo, usar proxy relativo
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // Fallback: intentar detectar automáticamente
  // Si estamos en producción y no hay variable, usar el mismo dominio
  return '/api';
};

const api = axios.create({
  baseURL: getApiBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a las requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-storage');
  if (token) {
    try {
      const parsed = JSON.parse(token);
      if (parsed.state?.token) {
        config.headers.Authorization = `Bearer ${parsed.state.token}`;
      }
    } catch {
      // Ignore parse errors from stale storage entries
    }
  }
  return config;
});

export interface LoginRequest {
  business_id?: string;
  phone?: string;
  email?: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    business_id: string;
    phone: string;
    role: string;
  };
}

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', data);
  return response.data;
};

export const register = async (data: LoginRequest & { role?: string }): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/register', data);
  return response.data;
};

export default api;

export interface PaymentConfigResponse {
  data: {
    publicKey: string;
    source: 'business' | 'env';
  } | null;
}

export interface UpdatePaymentConfigRequest {
  accessToken: string;
  publicKey: string;
  refreshToken?: string;
  userId?: string;
  isActive?: boolean;
}

export const getPaymentConfig = async (): Promise<PaymentConfigResponse> => {
  const response = await api.get<PaymentConfigResponse>('/payments/config');
  return response.data;
};

export const updatePaymentConfig = async (payload: UpdatePaymentConfigRequest): Promise<PaymentConfigResponse> => {
  const response = await api.put<PaymentConfigResponse>('/payments/config', payload);
  return response.data;
};

// Admin API
export interface Business {
  id: string;
  name: string;
  phone: string;
  email?: string;
  whatsapp_number: string;
  owner_phone: string;
  is_active: boolean;
  is_trial?: boolean;
  trial_start_date?: string;
  trial_end_date?: string;
  bot_status?: string;
  has_qr?: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessListResponse {
  data: Business[];
}

export interface BusinessResponse {
  data: Business & {
    bot_info?: {
      wid?: string;
      pushname?: string;
      platform?: string;
    };
    qr?: string | null;
  };
}

export interface CreateBusinessRequest {
  name: string;
  phone: string;
  email?: string;
  whatsapp_number: string;
  owner_phone: string;
  is_active?: boolean;
  is_trial?: boolean;
}

export const getBusinesses = async (): Promise<BusinessListResponse> => {
  const response = await api.get<BusinessListResponse>('/admin/businesses');
  return response.data;
};

export const getBusiness = async (id: string): Promise<BusinessResponse> => {
  const response = await api.get<BusinessResponse>(`/admin/businesses/${id}`);
  return response.data;
};

export const createBusiness = async (data: CreateBusinessRequest): Promise<BusinessResponse> => {
  const response = await api.post<BusinessResponse>('/admin/businesses', data);
  return response.data;
};

export const updateBusiness = async (id: string, data: Partial<CreateBusinessRequest>): Promise<BusinessResponse> => {
  const response = await api.put<BusinessResponse>(`/admin/businesses/${id}`, data);
  return response.data;
};

export const deleteBusiness = async (id: string): Promise<void> => {
  await api.delete(`/admin/businesses/${id}`);
};

export const activateBusiness = async (id: string): Promise<void> => {
  await api.post(`/admin/businesses/${id}/activate`);
};

export const getBusinessQR = async (id: string): Promise<{ data: { qr: string; status: string } }> => {
  const response = await api.get<{ data: { qr: string; status: string } }>(`/admin/businesses/${id}/qr`);
  return response.data;
};

export const reconnectBusinessBot = async (id: string): Promise<void> => {
  await api.post(`/admin/businesses/${id}/reconnect-bot`);
};

// System Config API
export interface SubscriptionPriceResponse {
  data: {
    price: string;
  };
}

export const getSubscriptionPrice = async (): Promise<SubscriptionPriceResponse> => {
  const response = await api.get<SubscriptionPriceResponse>('/admin/config/subscription-price');
  return response.data;
};

export const updateSubscriptionPrice = async (price: string): Promise<SubscriptionPriceResponse> => {
  const response = await api.put<SubscriptionPriceResponse>('/admin/config/subscription-price', { price });
  return response.data;
};

