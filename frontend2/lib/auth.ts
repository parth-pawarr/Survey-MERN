import { api, tokenManager, LoginResponse, AdminLoginResponse } from './api';

// Authentication types
export interface User {
  id: string;
  username: string;
  role: 'admin' | 'surveyor';
  assignedVillages?: string[];
  email?: string;
  mobile?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Authentication service
export class AuthService {
  // Login for both admin and surveyor
  static async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    try {
      // Try admin login first
      try {
        const adminResponse = await api.post<AdminLoginResponse>('/auth/admin-login', credentials);
        const { user: adminUser, token } = adminResponse.data;
        
        const user: User = {
          id: adminUser.id,
          username: adminUser.username,
          role: adminUser.role as 'admin',
        };
        
        tokenManager.setToken(token);
        tokenManager.setUserData(user);
        
        return { user, token };
      } catch (adminError) {
        // If admin login fails, try surveyor login
        const surveyorResponse = await api.post<LoginResponse>('/auth/login', credentials);
        const { user: surveyorUser, token } = surveyorResponse.data;
        
        const user: User = {
          id: surveyorUser.id,
          username: surveyorUser.username,
          role: surveyorUser.role as 'surveyor',
          assignedVillages: surveyorUser.assignedVillages,
        };
        
        tokenManager.setToken(token);
        tokenManager.setUserData(user);
        
        return { user, token };
      }
    } catch (error: any) {
      throw new Error(error.message || 'Login failed. Please check your credentials.');
    }
  }

  // Admin-specific login
  static async adminLogin(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    try {
      const response = await api.post<AdminLoginResponse>('/auth/admin-login', credentials);
      const { user: adminUser, token } = response.data;
      
      const user: User = {
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role as 'admin',
      };
      
      tokenManager.setToken(token);
      tokenManager.setUserData(user);
      
      return { user, token };
    } catch (error: any) {
      throw new Error(error.message || 'Admin login failed. Please check your credentials.');
    }
  }

  // Surveyor-specific login
  static async surveyorLogin(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    try {
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      const { user: surveyorUser, token } = response.data;
      
      const user: User = {
        id: surveyorUser.id,
        username: surveyorUser.username,
        role: surveyorUser.role as 'surveyor',
        assignedVillages: surveyorUser.assignedVillages,
      };
      
      tokenManager.setToken(token);
      tokenManager.setUserData(user);
      
      return { user, token };
    } catch (error: any) {
      throw new Error(error.message || 'Surveyor login failed. Please check your credentials.');
    }
  }

  // Get current user profile
  static async getProfile(): Promise<User> {
    try {
      const response = await api.get<User>('/auth/profile');
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get user profile.');
    }
  }

  // Logout
  static logout(): void {
    tokenManager.removeToken();
    // Redirect to login page will be handled by the interceptor
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    const token = tokenManager.getToken();
    const userData = tokenManager.getUserData();
    return !!(token && userData);
  }

  // Get current user from localStorage
  static getCurrentUser(): User | null {
    return tokenManager.getUserData();
  }

  // Get current token
  static getCurrentToken(): string | null {
    return tokenManager.getToken();
  }

  // Validate token (optional - can be used on app initialization)
  static async validateToken(): Promise<boolean> {
    try {
      await this.getProfile();
      return true;
    } catch (error) {
      this.logout();
      return false;
    }
  }

  // Setup initial admin (one-time setup)
  static async setupAdmin(username: string, password: string): Promise<void> {
    try {
      await api.post('/auth/setup-admin', { username, password });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to setup admin account.');
    }
  }
}

export default AuthService;
