import axios from 'axios';

// Obtener URL del backend desde variables de entorno o usar relativa
const getApiBaseURL = () => {
  // En producción, usar variable de entorno
  if (import.meta.env.VITE_API_URL) {
    console.log('[API] Using VITE_API_URL:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }
  
  // En desarrollo, usar proxy relativo
  if (import.meta.env.DEV) {
    console.log('[API] Development mode: using /api proxy');
    return '/api';
  }
  
  // Fallback: en producción sin variable, usar Render backend
  const fallbackURL = 'https://milo-bookings.onrender.com';
  console.warn('[API] ⚠️ VITE_API_URL not set! Using fallback:', fallbackURL);
  console.warn('[API] Please configure VITE_API_URL in Vercel environment variables');
  return fallbackURL;
};

const apiBaseURL = getApiBaseURL();
console.log('[API] Base URL configured:', apiBaseURL);

const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 segundos timeout (Render free tier puede tardar ~30s en "despertar")
});

// Interceptor para logging de requests
api.interceptors.request.use(
  (config) => {
    console.log('[API] Request:', config.method?.toUpperCase(), config.url, config.baseURL);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para logging de responses
api.interceptors.response.use(
  (response) => {
    console.log('[API] Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('[API] Response error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

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
    phone?: string;
    email?: string;
    name?: string;
    role: string;
    is_system_user?: boolean;
  };
}

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/api/auth/login', data);
  return response.data;
};

export const register = async (data: LoginRequest & { role?: string }): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/api/auth/register', data);
  return response.data;
};

export interface ForgotPasswordRequest {
  email?: string; // Para super admin
  business_id?: string; // Para business user
  phone?: string; // Para business user
}

export interface ForgotPasswordResponse {
  message: string;
  success: boolean;
  token?: string; // Token para super admin (MVP - debería enviarse por email)
  isSystemUser?: boolean;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ResetPasswordResponse {
  message: string;
  success: boolean;
}

export const forgotPassword = async (data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
  const response = await api.post<ForgotPasswordResponse>('/api/auth/forgot-password', data);
  return response.data;
};

export const resetPassword = async (data: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
  const response = await api.post<ResetPasswordResponse>('/api/auth/reset-password', data);
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
  const response = await api.get<PaymentConfigResponse>('/api/payments/config');
  return response.data;
};

export const updatePaymentConfig = async (payload: UpdatePaymentConfigRequest): Promise<PaymentConfigResponse> => {
  const response = await api.put<PaymentConfigResponse>('/api/payments/config', payload);
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
  const response = await api.get<BusinessListResponse>('/api/admin/businesses');
  return response.data;
};

export const getBusiness = async (id: string): Promise<BusinessResponse> => {
  const response = await api.get<BusinessResponse>(`/api/admin/businesses/${id}`);
  return response.data;
};

export const createBusiness = async (data: CreateBusinessRequest): Promise<BusinessResponse> => {
  const response = await api.post<BusinessResponse>('/api/admin/businesses', data);
  return response.data;
};

export const updateBusiness = async (id: string, data: Partial<CreateBusinessRequest>): Promise<BusinessResponse> => {
  const response = await api.put<BusinessResponse>(`/api/admin/businesses/${id}`, data);
  return response.data;
};

export const deleteBusiness = async (id: string): Promise<void> => {
  await api.delete(`/api/admin/businesses/${id}`);
};

export const activateBusiness = async (id: string): Promise<void> => {
  await api.post(`/api/admin/businesses/${id}/activate`);
};

export const getBusinessQR = async (id: string): Promise<{ data: { qr: string; status: string } }> => {
  const response = await api.get<{ data: { qr: string; status: string } }>(`/api/admin/businesses/${id}/qr`);
  return response.data;
};

export const reconnectBusinessBot = async (id: string): Promise<void> => {
  await api.post(`/api/admin/businesses/${id}/reconnect-bot`);
};

// System Config API
export interface SubscriptionPriceResponse {
  data: {
    price: string;
  };
}

export const getSubscriptionPrice = async (): Promise<SubscriptionPriceResponse> => {
  const response = await api.get<SubscriptionPriceResponse>('/api/admin/config/subscription-price');
  return response.data;
};

export const updateSubscriptionPrice = async (price: string): Promise<SubscriptionPriceResponse> => {
  const response = await api.put<SubscriptionPriceResponse>('/api/admin/config/subscription-price', { price });
  return response.data;
};

// Insurance Providers API
export interface InsuranceProvider {
  id: string;
  business_id: string;
  name: string;
  copay_amount: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InsuranceProviderListResponse {
  data: InsuranceProvider[];
}

export interface InsuranceProviderResponse {
  data: InsuranceProvider;
}

export interface CreateInsuranceProviderRequest {
  name: string;
  copay_amount: number;
  display_order?: number;
  is_active?: boolean;
}

export const getInsuranceProviders = async (): Promise<InsuranceProviderListResponse> => {
  const response = await api.get<InsuranceProviderListResponse>('/api/insurance');
  return response.data;
};

export const createInsuranceProvider = async (data: CreateInsuranceProviderRequest): Promise<InsuranceProviderResponse> => {
  const response = await api.post<InsuranceProviderResponse>('/api/insurance', data);
  return response.data;
};

export const updateInsuranceProvider = async (id: string, data: Partial<CreateInsuranceProviderRequest>): Promise<InsuranceProviderResponse> => {
  const response = await api.put<InsuranceProviderResponse>(`/api/insurance/${id}`, data);
  return response.data;
};

export const deleteInsuranceProvider = async (id: string): Promise<void> => {
  await api.delete(`/api/insurance/${id}`);
};

export const toggleInsuranceProvider = async (id: string): Promise<InsuranceProviderResponse> => {
  const response = await api.patch<InsuranceProviderResponse>(`/api/insurance/${id}/toggle`);
  return response.data;
};

// Service API
export interface Service {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  display_order: number;
  is_active: boolean;
  requires_payment: boolean;
  has_multiple_resources?: boolean;
  resource_count?: number | null;
}

export interface ServiceListResponse {
  data: Service[];
}

export interface ServiceResponse {
  data: Service;
}

export const getServices = async (): Promise<ServiceListResponse> => {
  const response = await api.get<ServiceListResponse>('/api/services');
  return response.data;
};

export const getService = async (id: string): Promise<ServiceResponse> => {
  const response = await api.get<ServiceResponse>(`/api/services/${id}`);
  return response.data;
};

export const createService = async (data: Partial<Service>): Promise<ServiceResponse> => {
  const response = await api.post<ServiceResponse>('/api/services', data);
  return response.data;
};

export const updateService = async (id: string, data: Partial<Service>): Promise<ServiceResponse> => {
  const response = await api.put<ServiceResponse>(`/api/services/${id}`, data);
  return response.data;
};

export const deleteService = async (id: string): Promise<void> => {
  await api.delete(`/api/services/${id}`);
};

export const toggleServiceActive = async (id: string): Promise<ServiceResponse> => {
  const response = await api.patch<ServiceResponse>(`/api/services/${id}/toggle`);
  return response.data;
};

// Service Resources API
export interface ServiceResource {
  id: string;
  service_id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const getServiceResources = async (serviceId: string): Promise<{ data: ServiceResource[] }> => {
  const response = await api.get<{ data: ServiceResource[] }>(`/api/service-resources/service/${serviceId}`);
  return response.data;
};

export const createServiceResource = async (data: { service_id: string; name: string; display_order?: number }): Promise<{ data: ServiceResource }> => {
  const response = await api.post<{ data: ServiceResource }>('/api/service-resources', data);
  return response.data;
};

export const updateServiceResource = async (id: string, data: { name?: string; display_order?: number }): Promise<{ data: ServiceResource }> => {
  const response = await api.put<{ data: ServiceResource }>(`/api/service-resources/${id}`, data);
  return response.data;
};

export const deleteServiceResource = async (id: string): Promise<void> => {
  await api.delete(`/api/service-resources/${id}`);
};

export const toggleServiceResourceActive = async (id: string): Promise<{ data: ServiceResource }> => {
  const response = await api.patch<{ data: ServiceResource }>(`/api/service-resources/${id}/toggle`);
  return response.data;
};

