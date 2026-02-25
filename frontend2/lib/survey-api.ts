import {
  SurveyorApiService,
  type CreateSurveyRequest,
  type HealthMemberPayload,
  type EducationChildPayload,
  type UnemployedMemberPayload,
} from './surveyor-api';

// ─── Stepper-local form types (what the UI collects) ────────────────────────
// These match exactly what survey-stepper-complete.tsx uses internally.
// They are NOT the same as the backend schema — formDataToRequest() handles the mapping.

export interface HouseholdData {
  representativeName: string;
  mobileNumber: string;
  representativeAge: number;
  representativeGender: string;
  totalFamilyMembers: number;
  ayushmanCardStatus: string;
  ayushmanMembersCount?: number;
}

// Health member as collected by the stepper UI
export interface HealthMember {
  patient: string;           // selector value: rep name or "Other"
  patientName?: string;      // filled when patient === "Other"
  age?: number;
  gender?: string;
  hasAadhar: string;         // UI-only, not saved to backend
  hasAyushman: string;       // UI-only, not saved to backend
  healthIssue: string;       // maps → healthIssueType
  healthIssueOther?: string; // maps → otherHealthIssue
  morbidity: string;         // maps → hasAdditionalMorbidity
  morbidityOther?: string;   // maps → additionalMorbidityDetails
  medicines: string[];       // UI-only, not saved to backend
  hospitalVisits: string;    // UI-only, not saved to backend
  treatments: string[];      // UI-only, not saved to backend
}

// Education member as collected by the stepper UI
export interface EducationMember {
  person: string;            // selector value: rep name or "Other"
  name?: string;             // filled when person === "Other"  maps → Name
  age?: number;
  gender?: string;
  hasAadhar: string;         // UI-only, not saved to backend
  educationLevel: string;    // maps → educationLevel
  schoolType: string;        // UI-only, not saved to backend
  medium: string;            // UI-only, not saved to backend
  scholarship: string;       // UI-only, not saved to backend
  dropoutReason?: string;    // UI-only, not saved to backend
  currentClass?: string;     // UI-only, not saved to backend
  schoolName?: string;       // UI-only, not saved to backend
  educationalIssues: string[]; // maps → educationalIssues
}

// Employment/unemployment member as collected by the stepper UI
export interface EmploymentMember {
  person: string;            // selector value: rep name or "Other"
  name?: string;             // filled when person === "Other"  maps → name
  age?: number;
  gender?: string;
  hasAadhar: string;         // UI-only, not saved to backend
  employmentType: string;    // UI-only, not saved to backend
  employmentStatus: string;  // UI-only, not saved to backend
  businessType?: string;     // UI-only, not saved to backend
  businessSector?: string;   // UI-only, not saved to backend
  monthlyIncome?: string;    // UI-only, not saved to backend
  workLocation?: string;     // UI-only, not saved to backend
  unemploymentReason?: string; // maps → unemploymentReason
  skills: string[];          // maps → skillsKnown
  skillOther?: string;       // maps → otherSkills
  highestEducation: string;  // maps → highestEducation
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

// ─── Helpers: resolve actual name from "person" / "patient" selector ────────

function resolvePatientName(member: HealthMember): string {
  return member.patient === 'Other'
    ? (member.patientName || '').trim()
    : member.patient.trim();
}

function resolvePersonName(member: EducationMember | EmploymentMember): string {
  return member.person === 'Other'
    ? ((member as any).name || '').trim()
    : member.person.trim();
}

// ─── Survey API service for form operations ──────────────────────────────────
export class SurveyApiService {
  private static currentSurveyId: string | null = null;

  static async createSurvey(data: CreateSurveyRequest) {
    const response = await SurveyorApiService.createSurvey(data);
    this.currentSurveyId = response.surveyId;
    return response;
  }

  static async updateSurvey(data: Partial<CreateSurveyRequest>) {
    if (!this.currentSurveyId) {
      throw new Error('No active survey to update');
    }
    return SurveyorApiService.updateSurvey(this.currentSurveyId, data);
  }

  static async submitSurvey() {
    if (!this.currentSurveyId) {
      throw new Error('No active survey to submit');
    }
    return SurveyorApiService.submitSurvey(this.currentSurveyId);
  }

  static getCurrentSurveyId() {
    return this.currentSurveyId;
  }

  static clearCurrentSurvey() {
    this.currentSurveyId = null;
  }

  // ─── Core mapping: SurveyFormData (UI) → CreateSurveyRequest (backend) ───
  static formDataToRequest(formData: SurveyFormData, village: string): CreateSurveyRequest {
    const { household, health, education, employment, location } = formData;

    // ── Phase 2: map health members ──────────────────────────────────────────
    const healthMembers: HealthMemberPayload[] = health.members
      .filter((m) => resolvePatientName(m))           // skip entries with no name
      .map((m): HealthMemberPayload => ({
        patientName: resolvePatientName(m),            // UI: patient / patientName
        age: m.age ?? 0,
        gender: m.gender ?? '',
        healthIssueType: m.healthIssue,                // UI: healthIssue → backend: healthIssueType
        otherHealthIssue: m.healthIssueOther,          // UI: healthIssueOther → backend: otherHealthIssue
        hasAdditionalMorbidity: m.morbidity || 'No',  // UI: morbidity → backend: hasAdditionalMorbidity
        additionalMorbidityDetails: m.morbidityOther, // UI: morbidityOther → backend: additionalMorbidityDetails
        // NOTE: hasAadhar, hasAyushman, medicines, hospitalVisits, treatments are UI-only and intentionally excluded
      }));

    // ── Phase 3: map education children ─────────────────────────────────────
    const educationChildren: EducationChildPayload[] = education.members
      .filter((m) => resolvePersonName(m))
      .map((m): EducationChildPayload => ({
        Name: resolvePersonName(m),                    // UI: person / name → backend: Name (capital N)
        age: m.age ?? 0,
        gender: m.gender ?? '',
        educationLevel: m.educationLevel,
        educationalIssues: m.educationalIssues ?? [],
        // NOTE: hasAadhar, schoolType, medium, scholarship, dropoutReason, currentClass, schoolName are UI-only
      }));

    // ── Phase 4: map unemployed members ──────────────────────────────────────
    // The stepper collects "employment" members; unemployed members marked with
    // unemploymentReason are mapped to the UnemployedMemberSchema.
    const unemployedMembers: UnemployedMemberPayload[] = employment.members
      .filter((m) => resolvePersonName(m))
      .map((m): UnemployedMemberPayload => ({
        name: resolvePersonName(m),                    // UI: person / name → backend: name
        age: m.age ?? 0,
        gender: m.gender ?? '',
        highestEducation: m.highestEducation,
        skillsKnown: m.skills ?? [],                   // UI: skills → backend: skillsKnown
        otherSkills: m.skillOther,                     // UI: skillOther → backend: otherSkills
        unemploymentReason: m.unemploymentReason ?? '',
        // NOTE: hasAadhar, employmentType, employmentStatus, businessType, etc. are UI-only
      }));

    // Determine hasUnEmployedMembers based on whether there are any members
    const hasUnEmployedMembers = unemployedMembers.length > 0 ? 'Yes' : 'No';

    return {
      // Phase 1
      representativeName: household.representativeName,
      mobileNumber: household.mobileNumber,
      representativeAge: household.representativeAge,
      representativeGender: household.representativeGender,
      totalFamilyMembers: household.totalFamilyMembers,
      ayushmanCardStatus: household.ayushmanCardStatus,
      ayushmanMembersCount: household.ayushmanMembersCount,
      // Phase 2
      hasHealthIssues: health.hasHealthIssues,
      healthMembers: health.hasHealthIssues === 'Yes' ? healthMembers : [],
      // Phase 3
      hasSchoolChildren: education.hasSchoolChildren,
      educationChildren: education.hasSchoolChildren === 'Yes' ? educationChildren : [],
      // Phase 4
      hasEmployedMembers: employment.hasEmployedMembers,
      hasUnEmployedMembers,
      unemployedMembers: hasUnEmployedMembers === 'Yes' ? unemployedMembers : [],
      // Metadata
      village,
      latitude: location?.latitude,
      longitude: location?.longitude,
    };
  }

  // ─── Draft management (localStorage offline backup) ──────────────────────

  static saveDraft(formData: SurveyFormData, village: string) {
    try {
      const draft = {
        formData,
        village,
        timestamp: new Date().toISOString(),
        surveyId: this.currentSurveyId,
      };
      localStorage.setItem('survey_draft', JSON.stringify(draft));
    } catch (error) {
      console.warn('Failed to save draft to localStorage:', error);
    }
  }

  static loadDraft(): { formData: SurveyFormData; village: string; surveyId?: string } | null {
    try {
      const raw = localStorage.getItem('survey_draft');
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      const draftTime = new Date(parsed.timestamp);
      const hoursDiff = (Date.now() - draftTime.getTime()) / (1000 * 60 * 60);

      if (hoursDiff < 24) {
        this.currentSurveyId = parsed.surveyId || null;
        return {
          formData: parsed.formData,
          village: parsed.village,
          surveyId: parsed.surveyId,
        };
      }

      // Draft is older than 24 hours — discard
      localStorage.removeItem('survey_draft');
    } catch (error) {
      console.warn('Failed to load draft from localStorage:', error);
    }
    return null;
  }

  static clearDraft() {
    localStorage.removeItem('survey_draft');
  }
}

export default SurveyApiService;
