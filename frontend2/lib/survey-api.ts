import { SurveyorApiService, type CreateSurveyRequest } from './surveyor-api';

// Survey form types
export interface HouseholdData {
  representativeName: string;
  mobileNumber: string;
  representativeAge: number;
  representativeGender: string;
  totalFamilyMembers: number;
  ayushmanCardStatus: string;
  ayushmanMembersCount?: number;
}

export interface HealthMember {
  patient: string;
  patientName?: string;
  age?: number;
  gender?: string;
  hasAadhar: string;
  hasAyushman: string;
  healthIssue: string;
  healthIssueOther?: string;
  morbidity: string;
  morbidityOther?: string;
  medicines: string[];
  hospitalVisits: string;
  treatments: string[];
}

export interface EducationMember {
  person: string;
  name?: string;
  age?: number;
  gender?: string;
  hasAadhar: string;
  educationLevel: string;
  schoolType: string;
  medium: string;
  scholarship: string;
  dropoutReason?: string;
  currentClass?: string;
  schoolName?: string;
  educationalIssues: string[];
}

export interface EmploymentMember {
  person: string;
  name?: string;
  age?: number;
  gender?: string;
  hasAadhar: string;
  employmentType: string;
  employmentStatus: string;
  businessType?: string;
  businessSector?: string;
  monthlyIncome?: string;
  workLocation?: string;
  unemploymentReason?: string;
  skills: string[];
  skillOther?: string;
  highestEducation: string;
}

export interface SurveyFormData {
  household: HouseholdData;
  health: {
    hasHealthIssues: string;
    members: HealthMember[];
  };
  education: {
    hasSchoolChildren: string;
    members: EducationMember[];
  };
  employment: {
    hasEmployedMembers: string;
    members: EmploymentMember[];
  };
  location?: {
    latitude: number;
    longitude: number;
  };
}

// Survey API service for form operations
export class SurveyApiService {
  private static currentSurveyId: string | null = null;

  // Create a new survey
  static async createSurvey(data: CreateSurveyRequest) {
    try {
      const response = await SurveyorApiService.createSurvey(data);
      this.currentSurveyId = response.surveyId;
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Update existing survey
  static async updateSurvey(data: Partial<CreateSurveyRequest>) {
    if (!this.currentSurveyId) {
      throw new Error('No active survey to update');
    }
    try {
      const response = await SurveyorApiService.updateSurvey(this.currentSurveyId, data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Submit final survey
  static async submitSurvey() {
    if (!this.currentSurveyId) {
      throw new Error('No active survey to submit');
    }
    try {
      const response = await SurveyorApiService.submitSurvey(this.currentSurveyId);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get current survey ID
  static getCurrentSurveyId() {
    return this.currentSurveyId;
  }

  // Clear current survey ID
  static clearCurrentSurvey() {
    this.currentSurveyId = null;
  }

  // Convert form data to API request
  static formDataToRequest(formData: SurveyFormData, village: string): CreateSurveyRequest {
    return {
      representativeName: formData.household.representativeName,
      mobileNumber: formData.household.mobileNumber,
      representativeAge: formData.household.representativeAge,
      representativeGender: formData.household.representativeGender,
      totalFamilyMembers: formData.household.totalFamilyMembers,
      ayushmanCardStatus: formData.household.ayushmanCardStatus,
      ayushmanMembersCount: formData.household.ayushmanMembersCount,
      hasHealthIssues: formData.health.hasHealthIssues,
      hasSchoolChildren: formData.education.hasSchoolChildren,
      hasEmployedMembers: formData.employment.hasEmployedMembers,
      village,
      latitude: formData.location?.latitude,
      longitude: formData.location?.longitude,
    };
  }

  // Save draft to localStorage as backup
  static saveDraft(formData: SurveyFormData, village: string) {
    try {
      const draft = {
        formData,
        village,
        timestamp: new Date().toISOString(),
        surveyId: this.currentSurveyId
      };
      localStorage.setItem('survey_draft', JSON.stringify(draft));
    } catch (error) {
      console.warn('Failed to save draft to localStorage:', error);
    }
  }

  // Load draft from localStorage
  static loadDraft(): { formData: SurveyFormData; village: string; surveyId?: string } | null {
    try {
      const draft = localStorage.getItem('survey_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        // Only return draft if it's less than 24 hours old
        const draftTime = new Date(parsed.timestamp);
        const now = new Date();
        const hoursDiff = (now.getTime() - draftTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          this.currentSurveyId = parsed.surveyId || null;
          return {
            formData: parsed.formData,
            village: parsed.village,
            surveyId: parsed.surveyId
          };
        } else {
          // Remove old draft
          localStorage.removeItem('survey_draft');
        }
      }
    } catch (error) {
      console.warn('Failed to load draft from localStorage:', error);
    }
    return null;
  }

  // Clear draft
  static clearDraft() {
    localStorage.removeItem('survey_draft');
  }
}

export default SurveyApiService;
