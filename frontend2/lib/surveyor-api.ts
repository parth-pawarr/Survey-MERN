import { api } from './api';

// Surveyor API types
export interface Village {
  _id: string;
  name: string;
  totalHouseholds: number;
  surveyedHouseholds: number;
  assignedSurveyors: string[];
  surveyStats?: {
    totalSurveys: number;
    verifiedSurveys: number;
    submittedSurveys: number;
    draftSurveys: number;
  };
}

export interface Survey {
  _id: string;
  representativeName: string;
  mobileNumber: string;
  representativeAge: number;
  representativeGender: string;
  totalFamilyMembers: number;
  ayushmanCardStatus: string;
  ayushmanMembersCount?: number;
  hasHealthIssues: string;
  hasSchoolChildren: string;
  hasEmployedMembers: string;
  surveyorId: string;
  village: string;
  status: 'Draft' | 'Submitted' | 'Verified' | 'Rejected';
  createdAt: string;
  verifiedAt?: string;
  latitude?: number;
  longitude?: number;
}

export interface SurveyorStats {
  overview: {
    totalSurveys: number;
    draftSurveys: number;
    submittedSurveys: number;
    verifiedSurveys: number;
    rejectedSurveys: number;
    verificationRate: number;
    rejectionRate: number;
  };
  villageStats: Array<{
    _id: string;
    total: number;
    verified: number;
    submitted: number;
    draft: number;
    rejected: number;
  }>;
  recentActivity: Array<{
    _id: {
      year: number;
      month: number;
      day: number;
    };
    created: number;
    submitted: number;
  }>;
}

export interface CreateSurveyRequest {
  representativeName: string;
  mobileNumber: string;
  representativeAge: number;
  representativeGender: string;
  totalFamilyMembers: number;
  ayushmanCardStatus: string;
  ayushmanMembersCount?: number;
  hasHealthIssues: string;
  hasSchoolChildren: string;
  hasEmployedMembers: string;
  village: string;
  latitude?: number;
  longitude?: number;
}

// Surveyor API service
export class SurveyorApiService {
  // Village Access
  static async getAssignedVillages() {
    const response = await api.get<Village[]>('/villages/mine');
    return response.data;
  }

  static async getAllVillages() {
    const response = await api.get<Village[]>('/villages');
    return response.data;
  }

  // Survey Management
  static async getSurveys(village?: string) {
    const params = village ? `?village=${encodeURIComponent(village)}` : '';
    const response = await api.get<Survey[]>(`/surveys${params}`);
    return response.data;
  }

  static async getSurvey(id: string) {
    const response = await api.get<Survey>(`/surveys/${id}`);
    return response.data;
  }

  static async createSurvey(data: CreateSurveyRequest) {
    const response = await api.post<{ message: string; surveyId: string }>('/surveys', data);
    return response.data;
  }

  static async updateSurvey(id: string, data: Partial<CreateSurveyRequest>) {
    const response = await api.put<Survey>(`/surveys/${id}`, data);
    return response.data;
  }

  static async submitSurvey(id: string) {
    const response = await api.patch<{ message: string; survey: Survey }>(`/surveys/${id}/submit`);
    return response.data;
  }

  static async deleteSurvey(id: string) {
    const response = await api.delete<{ message: string }>(`/surveys/${id}`);
    return response.data;
  }

  static async getSurveyorStats() {
    const response = await api.get<SurveyorStats>('/surveys/stats/my');
    return response.data;
  }

  static async getSurveyHistory(id: string) {
    const response = await api.get(`/surveys/${id}/history`);
    return response.data;
  }
}

export default SurveyorApiService;
