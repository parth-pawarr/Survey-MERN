// Types
export interface Surveyor {
  id: string;
  name: string;
  mobile: string;
  username: string;
  password: string;
  villages: string[];
}

export interface HealthMember {
  patient: string;
  patientName?: string;
  age?: number;
  gender?: string;
  healthIssue: string;
  healthIssueOther?: string;
  morbidity: string;
  morbidityOther?: string;
}

export interface EducationMember {
  person: string;
  name?: string;
  age?: number;
  gender?: string;
  educationLevel: string;
  educationalIssues: string[];
}

export interface UnemploymentMember {
  person: string;
  name?: string;
  age?: number;
  gender?: string;
  highestEducation: string;
  skills: string[];
  skillOther?: string;
  unemploymentReason: string;
  unemploymentReasonOther?: string;
}

export interface SurveyData {
  surveyorId: string;
  village: string;
  householdData: {
    representativeName: string;
    mobile: string;
    isWhatsApp: string;
    age: number;
    gender: string;
    totalFamilyMembers: number;
    ayushmanStatus: string;
    ayushmanMembersCount?: number;
  };
  healthcare: HealthMember[];
  education: EducationMember[];
  unemployment: UnemploymentMember[];
  timestamp: string;
}

export const VILLAGES = [
  "Village A",
  "Village B",
  "Village C",
  "Village D",
  "Village E",
  "Village F",
  "Village G",
  "Village H",
];

export const HEALTH_ISSUES = [
  "Diabetes",
  "Hypertension",
  "Heart Disease",
  "Asthma",
  "Tuberculosis",
  "Cancer",
  "Kidney Disease",
  "Disability",
  "Mental Health Issues",
  "Malnutrition",
  "Pregnancy-related complications",
  "Other",
];

export const MORBIDITY_OPTIONS = [
  "Knee Pain",
  "Back Pain",
  "Leg Pain",
  "Joint Pain",
  "Paralysis",
  "Other",
];

export const EDUCATION_LEVELS = [
  "Not enrolled",
  "Anganwadi",
  "Primary",
  "Secondary",
  "Higher Secondary",
  "ITI / Diploma",
  "College",
  "Dropout",
];

export const EDUCATION_ISSUES = [
  "Financial problem",
  "Transportation issue",
  "Poor academic performance",
  "Dropped out",
  "Lack of digital access",
  "Lack of books/material",
  "Health issue",
  "Family responsibility",
  "Other",
];

export const UNEMPLOYMENT_EDUCATION = [
  "Illiterate",
  "Primary",
  "10th Pass",
  "12th Pass",
  "Graduate",
  "Postgraduate",
];

export const SKILLS = [
  "12 Balutedar (बारा बलुतेदार) ",
  "Farming",
  "Mason",
  "Electrician",
  "Plumbing",
  "Driving",
  "Computer skills",
  "Mobile repair",
  "Handicrafts",
  "Cooking",
  "Hardware",
  "Other",
];

export const UNEMPLOYMENT_REASONS = [
  "No skills",
  "Low education",
  "Health issue",
  "No job opportunities",
  "Financial problems",
  "Family responsibilities",
  "Migration issue",
  "Other",
];

export const GENDERS = ["Male", "Female", "Other"];

// Hardcoded admin credentials — REMOVED (use backend auth via /api/auth/login)

// LocalStorage helpers (used for offline draft saving)
export function getSurveyors(): Surveyor[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem("surveyors");
  return data ? JSON.parse(data) : [];
}

export function saveSurveyors(surveyors: Surveyor[]) {
  localStorage.setItem("surveyors", JSON.stringify(surveyors));
}

export function getSurveys(): SurveyData[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem("surveys");
  return data ? JSON.parse(data) : [];
}

export function saveSurvey(survey: SurveyData) {
  const surveys = getSurveys();
  surveys.push(survey);
  localStorage.setItem("surveys", JSON.stringify(surveys));
}

export function checkDuplicate(village: string, mobile: string): boolean {
  const surveys = getSurveys();
  return surveys.some((s) => s.village === village && s.householdData.mobile === mobile);
}

export function getSurveysBySurveyor(surveyorId: string): SurveyData[] {
  return getSurveys().filter((s) => s.surveyorId === surveyorId);
}

export function getBadge(count: number): { label: string; color: string } | null {
  if (count >= 100) return { label: "Platinum", color: "bg-foreground text-card" };
  if (count >= 50) return { label: "Gold", color: "bg-accent text-accent-foreground" };
  if (count >= 25) return { label: "Silver", color: "bg-muted text-muted-foreground" };
  if (count >= 10) return { label: "Bronze", color: "bg-secondary text-secondary-foreground" };
  return null;
}
