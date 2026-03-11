import { api, tokenManager, LoginResponse } from './api';

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
  // Unified login — uses a single /auth/login endpoint for both admin and surveyor
  // api.post<T> now returns T directly (no .data wrapper needed)
  static async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    try {
      const result = await api.post<LoginResponse>('/auth/login', credentials);
      // result = { token, user: { id, username, role, assignedVillages? }, message }

      const user: User = {
        id: result.user.id,
        username: result.user.username,
        role: result.user.role as 'admin' | 'surveyor',
        assignedVillages: result.user.assignedVillages,
      };

      tokenManager.setToken(result.token);
      tokenManager.setUserData(user);

      return { user, token: result.token };
    } catch (error: any) {
      throw new Error(error.message || 'Login failed. Please check your credentials.');
    }
  }

  // Admin-specific login (dedicated endpoint)
  static async adminLogin(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    try {
      const result = await api.post<LoginResponse>('/auth/admin-login', credentials);

      const user: User = {
        id: result.user.id,
        username: result.user.username,
        role: 'admin',
      };

      tokenManager.setToken(result.token);
      tokenManager.setUserData(user);

      return { user, token: result.token };
    } catch (error: any) {
      throw new Error(error.message || 'Admin login failed. Please check your credentials.');
    }
  }

  // Surveyor-specific login
  static async surveyorLogin(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    try {
      const result = await api.post<LoginResponse>('/auth/login', credentials);

      const user: User = {
        id: result.user.id,
        username: result.user.username,
        role: result.user.role as 'surveyor',
        assignedVillages: result.user.assignedVillages,
      };

      tokenManager.setToken(result.token);
      tokenManager.setUserData(user);

      return { user, token: result.token };
    } catch (error: any) {
      throw new Error(error.message || 'Surveyor login failed. Please check your credentials.');
    }
  }

  // Get current user profile
  // /auth/profile returns { user: { id, username, role, ... } } — unwrap the inner user object
  static async getProfile(): Promise<User> {
    try {
      const result = await api.get<{ user: User }>('/auth/profile');
      return result.user;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get user profile.');
    }
  }

  // Logout
  static logout(): void {
    tokenManager.removeToken();
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

  // Validate token by calling /auth/profile
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
