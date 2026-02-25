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
// NOTE: api.get/post/etc return T directly (no .data wrapper) — backend sends flat JSON
export class AdminApiService {
  // Surveyor Management
  static async getSurveyors(page = 1, limit = 20, search?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });
    return api.get<{ surveyors: Surveyor[]; pagination: any }>(`/admin/surveyors?${params}`);
  }

  static async createSurveyor(data: CreateSurveyorRequest) {
    return api.post<{ message: string; surveyorId: string }>('/admin/surveyors', data);
  }

  static async getSurveyor(id: string) {
    return api.get<Surveyor>(`/admin/surveyors/${id}`);
  }

  static async updateSurveyor(id: string, data: UpdateSurveyorRequest) {
    return api.put<{ message: string; surveyor: Surveyor }>(`/admin/surveyors/${id}`, data);
  }

  static async updateSurveyorVillages(id: string, villages: string[]) {
    return api.put<{ message: string; surveyor: Surveyor }>(`/admin/surveyors/${id}/villages`, { assignedVillages: villages });
  }

  static async toggleSurveyorStatus(id: string) {
    return api.patch<{ message: string; surveyor: Surveyor }>(`/admin/surveyors/${id}/status`);
  }

  static async resetSurveyorPassword(id: string, newPassword?: string) {
    return api.patch<{ message: string }>(`/admin/surveyors/${id}/reset-password`, { newPassword });
  }

  // Village Management
  static async getVillages(page = 1, limit = 20, search?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });
    return api.get<{ villages: Village[]; pagination: any }>(`/admin/villages?${params}`);
  }

  static async getVillage(id: string) {
    return api.get<Village>(`/admin/villages/${id}`);
  }

  static async createVillage(data: CreateVillageRequest) {
    return api.post<{ message: string; village: Village }>(`/admin/villages`, data);
  }

  static async updateVillage(id: string, data: Partial<CreateVillageRequest>) {
    return api.put<{ message: string; village: Village }>(`/admin/villages/${id}`, data);
  }

  static async assignVillageSurveyors(id: string, surveyors: string[]) {
    return api.put<{ message: string; village: Village }>(`/admin/villages/${id}/surveyors`, { assignedSurveyors: surveyors });
  }

  static async deleteVillage(id: string) {
    return api.delete<{ message: string; village: Village }>(`/admin/villages/${id}`);
  }

  // Dashboard Analytics
  static async getDashboardStats() {
    return api.get<DashboardStats>('/admin/dashboard/stats');
  }

  static async getSurveyAnalytics(startDate?: string, endDate?: string, village?: string, surveyor?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (village) params.append('village', village);
    if (surveyor) params.append('surveyor', surveyor);
    return api.get(`/admin/analytics/surveys?${params}`);
  }

  static async getSurveyorPerformance(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return api.get(`/admin/analytics/surveyors?${params}`);
  }

  // Data Export
  static async exportSurveyData(format: 'json' | 'csv' = 'json', filters?: any) {
    const params = new URLSearchParams({ format });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value as string);
      });
    }
    return api.get(`/admin/export/surveys?${params}`);
  }

  static async exportSurveyorPerformance(format: 'json' | 'csv' = 'json', startDate?: string, endDate?: string) {
    const params = new URLSearchParams({ format });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return api.get(`/admin/export/surveyor-performance?${params}`);
  }

  static async exportVillageStats(format: 'json' | 'csv' = 'json') {
    return api.get(`/admin/export/village-stats?format=${format}`);
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
    return api.get(`/admin/surveys/submitted?${params}`);
  }

  static async getSurveyForReview(id: string) {
    return api.get(`/admin/surveys/${id}/review`);
  }

  static async approveSurvey(id: string, verificationNotes?: string) {
    return api.patch(`/admin/surveys/${id}/approve`, { verificationNotes });
  }

  static async rejectSurvey(id: string, rejectionReason: string, verificationNotes?: string) {
    return api.patch(`/admin/surveys/${id}/reject`, { rejectionReason, verificationNotes });
  }

  static async getVerificationStats() {
    return api.get('/admin/verification-stats');
  }
}

export default AdminApiService;
