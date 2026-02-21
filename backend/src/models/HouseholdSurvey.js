const mongoose = require('mongoose');
const { healthIssues, educationLevels, employmentTypes, unemploymentReasons, skills } = require('./enum');

const HealthIssueSchema = new mongoose.Schema({
  patientName: { type: String, required: true, maxlength: 100 },
  age: { type: Number, required: true, min: 0, max: 120 },
  gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
  healthIssueType: { type: String, required: true, enum: healthIssues },
  otherHealthIssue: String,
  hasAdditionalMorbidity: { type: String, required: true, enum: ['Yes', 'No'] },
  additionalMorbidityDetails: String
});

const EducationProblem = new mongoose.Schema({
  Name: { type: String, required: true, maxlength: 100 },
  age: { type: Number, required: true, min: 0, max: 25 },
  gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
  educationLevel: { type: String, required: true, enum: educationLevels },
  // hasEducationalIssues: { type: String, required: true, enum: ['Yes', 'No'] },
  educationalIssues: [{ type: String, enum: ['Financial problem', 'Transportation issue', 'Poor academic performance', 'Dropped out', 'Lack of digital access', 'Lack of books/material', 'Health issue', 'Family responsibility', 'Other'] }],
  otherEducationalIssue: String,
  // awareOfGovtSchemes: { type: String, required: true, enum: ['Yes', 'No', "Heard but don't know details"] }
});

// const EmploymentMemberSchema = new mongoose.Schema({
//   name: { type: String, required: true, maxlength: 100 },
//   age: { type: Number, required: true, min: 15, max: 100 },
//   gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
//   employmentType: { type: String, required: true, enum: employmentTypes },
//   otherEmploymentType: String
// });

const UnemployedMemberSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 100 },
  age: { type: Number, required: true, min: 15, max: 100 },
  gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
  highestEducation: { type: String, required: true, enum: ['Illiterate', 'Primary', '10th Pass', '12th Pass', 'Graduate', 'Postgraduate'] },
  skillsKnown: [{ type: String, enum: skills }],
  otherSkills: String,
  unemploymentReason: { type: String, required: true, enum: unemploymentReasons },
  otherReason: String
});

const HouseholdSurveySchema = new mongoose.Schema({
  representativeName: { type: String, required: true, maxlength: 200 },
  mobileNumber: { 
    type: String, 
    required: true, 
    validate: {
      validator: v => /^\d{10}$/.test(v),
      message: 'Mobile number must be 10 digits'
    }
  },
  representativeAge: { type: Number, required: true, min: 18, max: 120 },
  representativeGender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
  totalFamilyMembers: { type: Number, required: true, min: 1, max: 50 },
  ayushmanCardStatus: { type: String, required: true, enum: ['All Members Have', 'Some Members Have', 'None Have'] },
  ayushmanMembersCount: { type: Number, min: 0, max: 50 },
  hasHealthIssues: { type: String, required: true, enum: ['Yes', 'No'] },
  healthMembers: [HealthIssueSchema],
  hasSchoolChildren: { type: String, required: true, enum: ['Yes', 'No'] },
  educationChildren: [EducationChildSchema],
  hasEmployedMembers: { type: String, required: true, enum: ['Yes', 'No'] },
  employedMembers: [EmploymentMemberSchema],
  hasUnEmployedMembers: { type: String, required: true, enum: ['Yes', 'No'] },
  unemployedMembers: [UnemployedMemberSchema],
  surveyorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  village: { type: String, required: true, maxlength: 200 },
  status: { type: String, enum: ['Draft', 'Submitted', 'Verified', 'Rejected'], default: 'Draft' },
  latitude: Number,
  longitude: Number,
  // Verification fields
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: Date,
  verificationNotes: String,
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectedAt: Date,
  rejectionReason: String
}, { timestamps: true });

HouseholdSurveySchema.index({ surveyorId: 1, village: 1 });
HouseholdSurveySchema.index({ mobileNumber: 1 });

module.exports = mongoose.model('HouseholdSurvey', HouseholdSurveySchema, 'householdSurveys');
