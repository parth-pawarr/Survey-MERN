import { api } from './api';

// Admin API types
export interface Surveyor {
  _id: string;
  username: string;
  email?: string;
  mobile?: string;
  assignedVillages: string[];
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  createdBy?: string;
}

export interface CreateSurveyorRequest {
  username: string;
  password: string;
  email?: string;
  mobile?: string;
  assignedVillages: string[];
}

export interface UpdateSurveyorRequest {
  username?: string;
  email?: string;
  mobile?: string;
  assignedVillages?: string[];
  isActive?: boolean;
}

export interface Village {
  _id: string;
  name: string;
  totalHouseholds: number;
  surveyedHouseholds: number;
  assignedSurveyors: string[];
  createdAt: string;
  createdBy?: string;
}

export interface CreateVillageRequest {
  name: string;
  totalHouseholds: number;
  assignedSurveyors?: string[];
}

export interface DashboardStats {
  overview: {
    totalSurveyors: number;
    activeSurveyors: number;
    totalVillages: number;
    totalSurveys: number;
    verifiedSurveys: number;
    coverageRate: number;
  };
  surveyStatus: {
    draft: number;
    submitted: number;
    verified: number;
    rejected: number;
  };
  villageCoverage: {
    totalHouseholds: number;
    surveyedHouseholds: number;
    villagesWithSurveyors: number;
    coverageRate: number;
  };
  recentActivity: {
    recentSurveys: number;
    recentVerifications: number;
  };
  topSurveyors: Array<{
    username: string;
    verifiedCount: number;
  }>;
  monthlyTrends: Array<{
    _id: {
      year: number;
      month: number;
    };
    total: number;
    verified: number;
  }>;
}

// Admin API service
export class AdminApiService {
  // Surveyor Management
  static async getSurveyors(page = 1, limit = 20, search?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });
    
    const response = await api.get<{ surveyors: Surveyor[]; pagination: any }>(`/admin/surveyors?${params}`);
    return response.data;
  }

  static async createSurveyor(data: CreateSurveyorRequest) {
    const response = await api.post<{ message: string; surveyorId: string }>('/admin/surveyors', data);
    return response.data;
  }

  static async getSurveyor(id: string) {
    const response = await api.get<Surveyor>(`/admin/surveyors/${id}`);
    return response.data;
  }

  static async updateSurveyor(id: string, data: UpdateSurveyorRequest) {
    const response = await api.put<{ message: string; surveyor: Surveyor }>(`/admin/surveyors/${id}`, data);
    return response.data;
  }

  static async updateSurveyorVillages(id: string, villages: string[]) {
    const response = await api.put<{ message: string; surveyor: Surveyor }>(`/admin/surveyors/${id}/villages`, { assignedVillages: villages });
    return response.data;
  }

  static async toggleSurveyorStatus(id: string) {
    const response = await api.patch<{ message: string; surveyor: Surveyor }>(`/admin/surveyors/${id}/status`);
    return response.data;
  }

  static async resetSurveyorPassword(id: string, newPassword?: string) {
    const response = await api.patch<{ message: string }>(`/admin/surveyors/${id}/reset-password`, { newPassword });
    return response.data;
  }

  // Village Management
  static async getVillages(page = 1, limit = 20, search?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });
    
    const response = await api.get<{ villages: Village[]; pagination: any }>(`/admin/villages?${params}`);
    return response.data;
  }

  static async getVillage(id: string) {
    const response = await api.get<Village>(`/admin/villages/${id}`);
    return response.data;
  }

  static async createVillage(data: CreateVillageRequest) {
    const response = await api.post<{ message: string; village: Village }>(`/admin/villages`, data);
    return response.data;
  }

  static async updateVillage(id: string, data: Partial<CreateVillageRequest>) {
    const response = await api.put<{ message: string; village: Village }>(`/admin/villages/${id}`, data);
    return response.data;
  }

  static async assignVillageSurveyors(id: string, surveyors: string[]) {
    const response = await api.put<{ message: string; village: Village }>(`/admin/villages/${id}/surveyors`, { assignedSurveyors: surveyors });
    return response.data;
  }

  static async deleteVillage(id: string) {
    const response = await api.delete<{ message: string; village: Village }>(`/admin/villages/${id}`);
    return response.data;
  }

  // Dashboard Analytics
  static async getDashboardStats() {
    const response = await api.get<DashboardStats>('/admin/dashboard/stats');
    return response.data;
  }

  static async getSurveyAnalytics(startDate?: string, endDate?: string, village?: string, surveyor?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (village) params.append('village', village);
    if (surveyor) params.append('surveyor', surveyor);
    
    const response = await api.get(`/admin/analytics/surveys?${params}`);
    return response.data;
  }

  static async getSurveyorPerformance(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/admin/analytics/surveyors?${params}`);
    return response.data;
  }

  // Data Export
  static async exportSurveyData(format: 'json' | 'csv' = 'json', filters?: any) {
    const params = new URLSearchParams({ format });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value as string);
      });
    }
    
    const response = await api.get(`/admin/export/surveys?${params}`);
    return response.data;
  }

  static async exportSurveyorPerformance(format: 'json' | 'csv' = 'json', startDate?: string, endDate?: string) {
    const params = new URLSearchParams({ format });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/admin/export/surveyor-performance?${params}`);
    return response.data;
  }

  static async exportVillageStats(format: 'json' | 'csv' = 'json') {
    const response = await api.get(`/admin/export/village-stats?format=${format}`);
    return response.data;
  }

  // Survey Verification
  static async getSubmittedSurveys(page = 1, limit = 20, filters?: any) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value as string);
      });
    }
    
    const response = await api.get(`/admin/surveys/submitted?${params}`);
    return response.data;
  }

  static async getSurveyForReview(id: string) {
    const response = await api.get(`/admin/surveys/${id}/review`);
    return response.data;
  }

  static async approveSurvey(id: string, verificationNotes?: string) {
    const response = await api.patch(`/admin/surveys/${id}/approve`, { verificationNotes });
    return response.data;
  }

  static async rejectSurvey(id: string, rejectionReason: string, verificationNotes?: string) {
    const response = await api.patch(`/admin/surveys/${id}/reject`, { rejectionReason, verificationNotes });
    return response.data;
  }

  static async getVerificationStats() {
    const response = await api.get('/admin/verification-stats');
    return response.data;
  }
}

export default AdminApiService;
