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
  isWhatsAppNumber: string;
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

export interface SurveyListResponse {
  surveys: Survey[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
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

export interface HealthMemberPayload {
  patientName: string;
  age: number;
  gender: string;
  healthIssueType: string[];
  otherHealthIssue?: string;
  hasAdditionalMorbidity: string[];
  additionalMorbidityDetails?: string;
}

export interface EducationChildPayload {
  Name: string;             // capital N — matches backend EducationProblem schema
  age: number;
  gender: string;
  educationLevel: string;
  educationalIssues?: string[];
  otherEducationalIssue?: string;
}

export interface UnemployedMemberPayload {
  name: string;
  age: number;
  gender: string;
  employmentStatus: string;
  highestEducation: string;
  skillsKnown?: string[];   // backend field name
  otherSkills?: string;
  unemploymentReason?: string;  // Only included when employmentStatus === 'Unemployed'
  otherReason?: string;
}

export interface CreateSurveyRequest {
  // Phase 1 — Household basic info
  representativeName: string;
  mobileNumber: string;
  isWhatsAppNumber: string;
  representativeAge: number;
  representativeGender: string;
  totalFamilyMembers: number;
  ayushmanCardStatus: string;
  ayushmanMembersCount?: number;
  // Phase 2 — Health
  hasHealthIssues: string;
  healthMembers?: HealthMemberPayload[];
  // Phase 3 — Education
  hasSchoolChildren: string;
  educationChildren?: EducationChildPayload[];
  // Phase 4 — Employment
  hasEmployedMembers: string;
  hasUnEmployedMembers: string;
  unemployedMembers?: UnemployedMemberPayload[];
  // Metadata
  village: string;
  latitude?: number;
  longitude?: number;
}

// Surveyor API service
// NOTE: api.get/post/etc return T directly (no .data wrapper) — backend sends flat JSON
export class SurveyorApiService {
  // Village Access
  static async getAssignedVillages() {
    return api.get<Village[]>('/villages/mine');
  }

  static async getAllVillages() {
    return api.get<Village[]>('/villages');
  }

  // Survey Management
  static async getSurveys(village?: string, page: number = 1, limit: number = 10, search?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (village) params.append('village', village);
    if (search) params.append('search', search);

    return api.get<SurveyListResponse>(`/surveys?${params.toString()}`);
  }

  static async getSurvey(id: string) {
    return api.get<Survey>(`/surveys/${id}`);
  }

  static async createSurvey(data: CreateSurveyRequest) {
    return api.post<{ message: string; surveyId: string }>('/surveys', data);
  }

  static async updateSurvey(id: string, data: Partial<CreateSurveyRequest>) {
    return api.put<Survey>(`/surveys/${id}`, data);
  }

  static async submitSurvey(id: string) {
    return api.patch<{ message: string; survey: Survey }>(`/surveys/${id}/submit`);
  }

  static async deleteSurvey(id: string) {
    return api.delete<{ message: string }>(`/surveys/${id}`);
  }

  static async getSurveyorStats() {
    return api.get<SurveyorStats>('/surveys/stats/my');
  }

  static async getSurveyHistory(id: string) {
    return api.get(`/surveys/${id}/history`);
  }

  static async checkMobileNumber(mobile: string, excludeSurveyId?: string) {
    const params = new URLSearchParams({ mobile });
    if (excludeSurveyId) params.set('excludeSurveyId', excludeSurveyId);
    return api.get<{ exists: boolean; message?: string; survey?: { id: string; representativeName: string; village: string } }>(
      `/surveys/check-mobile?${params.toString()}`
    );
  }
}

export default SurveyorApiService;
