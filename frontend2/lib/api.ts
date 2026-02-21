import axios, { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Types for API responses
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
    assignedVillages?: string[];
  };
}

export interface AdminLoginResponse {
  message: string;
  token: string;
  user: {
    id: string;
    username: string;
    role: 'admin';
  };
}

// Create Axios instance with default configuration
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - Add auth token
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - Handle common errors
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    (error: AxiosError) => {
      // Handle 401 Unauthorized - Token expired
      if (error.response?.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        window.location.href = '/login';
      }
      
      // Handle network errors
      if (!error.response) {
        console.error('Network error:', error.message);
        return Promise.reject(new Error('Network connection failed. Please check your internet connection.'));
      }
      
      // Handle server errors
      const message = (error.response?.data as any)?.message || 'An error occurred. Please try again.';
      return Promise.reject(new Error(message));
    }
  );

  return client;
};

// API client instance
export const apiClient = createApiClient();

// Token management
export const tokenManager = {
  setToken: (token: string) => {
    localStorage.setItem('auth_token', token);
  },
  
  getToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },
  
  removeToken: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  },
  
  setUserData: (userData: any) => {
    localStorage.setItem('user_data', JSON.stringify(userData));
  },
  
  getUserData: (): any => {
    const data = localStorage.getItem('user_data');
    return data ? JSON.parse(data) : null;
  }
};

// Generic API wrapper
export const apiRequest = async <T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  data?: any,
  config?: any
): Promise<ApiResponse<T>> => {
  try {
    const response = await apiClient.request<ApiResponse<T>>({
      method,
      url,
      data,
      ...config,
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// Helper methods
export const api = {
  get: <T = any>(url: string, config?: any) => apiRequest<T>('GET', url, undefined, config),
  post: <T = any>(url: string, data?: any, config?: any) => apiRequest<T>('POST', url, data, config),
  put: <T = any>(url: string, data?: any, config?: any) => apiRequest<T>('PUT', url, data, config),
  patch: <T = any>(url: string, data?: any, config?: any) => apiRequest<T>('PATCH', url, data, config),
  delete: <T = any>(url: string, config?: any) => apiRequest<T>('DELETE', url, undefined, config),
};

export default api;
