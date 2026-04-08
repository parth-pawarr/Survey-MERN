'use strict';

const {
    HEALTH_ISSUES, MORBIDITIES, EDUCATION_LEVELS, SKILLS,
    UNEMPLOYMENT_REASONS, HIGHEST_EDUCATION, EDUCATIONAL_ISSUES,
    GENDERS, AYUSHMAN_STATUS, SURVEY_STATUS,
} = require('./config');

// ─── VALIDATION HELPERS ────────────────────────────────────────────────────────

const VALID_GENDERS = new Set(GENDERS);
const VALID_AYUSHMAN = new Set(AYUSHMAN_STATUS);
const VALID_STATUS = new Set(SURVEY_STATUS);
const VALID_HEALTH_ISSUES = new Set(HEALTH_ISSUES);
const VALID_MORBIDITIES = new Set(MORBIDITIES);
const VALID_EDU_LEVELS = new Set(EDUCATION_LEVELS);
const VALID_SKILLS = new Set(SKILLS);
const VALID_UNEMPLOYMENT_REASONS = new Set(UNEMPLOYMENT_REASONS);
const VALID_HIGHEST_EDU = new Set(HIGHEST_EDUCATION);
const VALID_EDU_ISSUES = new Set(EDUCATIONAL_ISSUES);
const VALID_EMPLOYMENT_STATUS = new Set(['Unemployed', 'Suboptimally Employed']);
const MOBILE_REGEX = /^\d{10}$/;
const WHATSAPP_VALUES = new Set(['Yes', 'No']);

function isString(v) { return typeof v === 'string'; }
function isNumber(v) { return typeof v === 'number' && !Number.isNaN(v); }
function isArray(v) { return Array.isArray(v); }
function isObjectId(v) {
    // Accept a mongoose ObjectId, its string form, or an object with _id/id
    if (!v) return false;
    const str = v.toString();
    return /^[a-f\d]{24}$/i.test(str);
}

/** Checks every item in an array is a member of a valid Set. */
function allInSet(arr, validSet) {
    return arr.every((item) => validSet.has(item));
}

// ─── SUB-DOCUMENT VALIDATORS ──────────────────────────────────────────────────

function validateHealthMember(member, idx, errors) {
    const prefix = `healthMembers[${idx}]`;

    if (!isString(member.patientName) || member.patientName.trim() === '') {
        errors.push(`${prefix}.patientName: required string`);
    }
    if (!isNumber(member.age) || member.age < 0 || member.age > 120) {
        errors.push(`${prefix}.age: must be number 0–120 (got ${member.age})`);
    }
    if (!isString(member.gender) || !VALID_GENDERS.has(member.gender)) {
        errors.push(`${prefix}.gender: must be one of ${GENDERS.join('/')} (got ${member.gender})`);
    }
    if (!isArray(member.healthIssueType)) {
        errors.push(`${prefix}.healthIssueType: must be an Array`);
    } else if (!allInSet(member.healthIssueType, VALID_HEALTH_ISSUES)) {
        errors.push(`${prefix}.healthIssueType: contains invalid value(s)`);
    }
    if (!isArray(member.hasAdditionalMorbidity)) {
        errors.push(`${prefix}.hasAdditionalMorbidity: must be an Array`);
    } else if (!allInSet(member.hasAdditionalMorbidity, VALID_MORBIDITIES)) {
        errors.push(`${prefix}.hasAdditionalMorbidity: contains invalid morbidity value(s)`);
    }
    // otherHealthIssue — optional string
    if ('otherHealthIssue' in member && !isString(member.otherHealthIssue)) {
        errors.push(`${prefix}.otherHealthIssue: must be a string if present`);
    }
}

function validateEducationChild(child, idx, errors) {
    const prefix = `educationChildren[${idx}]`;

    if (!isString(child.Name) || child.Name.trim() === '') {
        errors.push(`${prefix}.Name: required string (capital N)`);
    }
    if (!isNumber(child.age) || child.age < 0 || child.age > 25) {
        errors.push(`${prefix}.age: must be number 0–25 (got ${child.age})`);
    }
    if (!isString(child.gender) || !VALID_GENDERS.has(child.gender)) {
        errors.push(`${prefix}.gender: must be Male/Female/Other (got ${child.gender})`);
    }
    if (!isString(child.educationLevel) || !VALID_EDU_LEVELS.has(child.educationLevel)) {
        errors.push(`${prefix}.educationLevel: invalid value "${child.educationLevel}"`);
    }
    if (!isArray(child.educationalIssues)) {
        errors.push(`${prefix}.educationalIssues: must be an Array`);
    } else if (!allInSet(child.educationalIssues, VALID_EDU_ISSUES)) {
        errors.push(`${prefix}.educationalIssues: contains invalid value(s)`);
    }
    if ('otherEducationalIssue' in child && !isString(child.otherEducationalIssue)) {
        errors.push(`${prefix}.otherEducationalIssue: must be a string if present`);
    }
}

function validateUnemployedMember(member, idx, errors) {
    const prefix = `unemployedMembers[${idx}]`;

    if (!isString(member.name) || member.name.trim() === '') {
        errors.push(`${prefix}.name: required string`);
    }
    if (!isNumber(member.age) || member.age < 15 || member.age > 100) {
        errors.push(`${prefix}.age: must be number 15–100 (got ${member.age})`);
    }
    if (!isString(member.gender) || !VALID_GENDERS.has(member.gender)) {
        errors.push(`${prefix}.gender: must be Male/Female/Other`);
    }
    if (!isString(member.employmentStatus) || !VALID_EMPLOYMENT_STATUS.has(member.employmentStatus)) {
        errors.push(`${prefix}.employmentStatus: must be "Unemployed" or "Suboptimally Employed" (got "${member.employmentStatus}")`);
    }
    if (!isString(member.highestEducation) || !VALID_HIGHEST_EDU.has(member.highestEducation)) {
        errors.push(`${prefix}.highestEducation: invalid value "${member.highestEducation}"`);
    }
    if (!isArray(member.skillsKnown)) {
        errors.push(`${prefix}.skillsKnown: must be an Array`);
    } else if (!allInSet(member.skillsKnown, VALID_SKILLS)) {
        errors.push(`${prefix}.skillsKnown: contains invalid skill value(s)`);
    }
    // unemploymentReason: required ONLY when employmentStatus === 'Unemployed'
    if (member.employmentStatus === 'Unemployed') {
        if (!isString(member.unemploymentReason) || !VALID_UNEMPLOYMENT_REASONS.has(member.unemploymentReason)) {
            errors.push(`${prefix}.unemploymentReason: required and must be valid when status is "Unemployed" (got "${member.unemploymentReason}")`);
        }
    }
    // otherSkills — optional string
    if ('otherSkills' in member && !isString(member.otherSkills)) {
        errors.push(`${prefix}.otherSkills: must be a string if present`);
    }
    if ('otherReason' in member && !isString(member.otherReason)) {
        errors.push(`${prefix}.otherReason: must be a string if present`);
    }
}

// ─── MAIN VALIDATOR ───────────────────────────────────────────────────────────

/**
 * Validates a generated survey document against the Mongoose schema rules.
 * @param {Object} doc  Plain JS document object.
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validate(doc) {
    const errors = [];

    // ── Required top-level strings ──────────────────────────────────────────────
    if (!isString(doc.representativeName) || doc.representativeName.trim() === '') {
        errors.push('representativeName: required string');
    }
    if (!isString(doc.mobileNumber) || !MOBILE_REGEX.test(doc.mobileNumber)) {
        errors.push(`mobileNumber: must be exactly 10 digits (got "${doc.mobileNumber}")`);
    }
    // isWhatsAppNumber is optional in the generator but the Mongoose model requires it
    // We enforce presence for 'Submitted'/'Verified' docs only.
    if (['Submitted', 'Verified'].includes(doc.status)) {
        if (!isString(doc.isWhatsAppNumber) || !WHATSAPP_VALUES.has(doc.isWhatsAppNumber)) {
            errors.push(`isWhatsAppNumber: required "Yes"/"No" for status="${doc.status}" (got "${doc.isWhatsAppNumber}")`);
        }
    }

    // ── Numeric ranges ──────────────────────────────────────────────────────────
    if (!isNumber(doc.representativeAge) || doc.representativeAge < 18 || doc.representativeAge > 120) {
        errors.push(`representativeAge: must be 18–120 (got ${doc.representativeAge})`);
    }
    if (!isNumber(doc.totalFamilyMembers) || doc.totalFamilyMembers < 1 || doc.totalFamilyMembers > 50) {
        errors.push(`totalFamilyMembers: must be 1–50 (got ${doc.totalFamilyMembers})`);
    }

    // ── Enum fields ─────────────────────────────────────────────────────────────
    if (!isString(doc.representativeGender) || !VALID_GENDERS.has(doc.representativeGender)) {
        errors.push(`representativeGender: must be Male/Female/Other (got "${doc.representativeGender}")`);
    }
    if (!isString(doc.ayushmanCardStatus) || !VALID_AYUSHMAN.has(doc.ayushmanCardStatus)) {
        errors.push(`ayushmanCardStatus: invalid value "${doc.ayushmanCardStatus}"`);
    }
    if (!isString(doc.status) || !VALID_STATUS.has(doc.status)) {
        errors.push(`status: invalid value "${doc.status}"`);
    }

    // ── Ayushman count consistency ──────────────────────────────────────────────
    if (doc.ayushmanCardStatus === 'Some Members Have') {
        if (!isNumber(doc.ayushmanMembersCount)) {
            errors.push('ayushmanMembersCount: required number when status is "Some Members Have"');
        } else if (doc.ayushmanMembersCount < 1 || doc.ayushmanMembersCount >= doc.totalFamilyMembers) {
            errors.push(
                `ayushmanMembersCount: must be 1 ≤ count < totalFamilyMembers (got ${doc.ayushmanMembersCount}, family=${doc.totalFamilyMembers})`
            );
        }
    } else if ('ayushmanMembersCount' in doc && doc.ayushmanMembersCount !== undefined) {
        errors.push('ayushmanMembersCount: must NOT be present when ayushmanCardStatus != "Some Members Have"');
    }

    // ── surveyorId ──────────────────────────────────────────────────────────────
    if (!isObjectId(doc.surveyorId)) {
        errors.push('surveyorId: must be a valid ObjectId');
    }

    // ── village ─────────────────────────────────────────────────────────────────
    if (!isString(doc.village) || doc.village.trim() === '') {
        errors.push('village: required string');
    }

    // ── Flag → array: hasHealthIssues ──────────────────────────────────────────
    if (!['Yes', 'No'].includes(doc.hasHealthIssues)) {
        errors.push(`hasHealthIssues: must be "Yes" or "No" (got "${doc.hasHealthIssues}")`);
    }
    if (!isArray(doc.healthMembers)) {
        errors.push('healthMembers: must be an Array');
    } else {
        if (doc.hasHealthIssues === 'Yes' && doc.healthMembers.length === 0) {
            errors.push('healthMembers: must be non-empty when hasHealthIssues="Yes"');
        }
        if (doc.hasHealthIssues === 'No' && doc.healthMembers.length > 0) {
            errors.push('healthMembers: must be empty when hasHealthIssues="No"');
        }
        doc.healthMembers.forEach((m, i) => validateHealthMember(m, i, errors));
    }

    // ── Flag → array: hasSchoolChildren ────────────────────────────────────────
    if (!['Yes', 'No'].includes(doc.hasSchoolChildren)) {
        errors.push(`hasSchoolChildren: must be "Yes" or "No" (got "${doc.hasSchoolChildren}")`);
    }
    if (!isArray(doc.educationChildren)) {
        errors.push('educationChildren: must be an Array');
    } else {
        if (doc.hasSchoolChildren === 'Yes' && doc.educationChildren.length === 0) {
            errors.push('educationChildren: must be non-empty when hasSchoolChildren="Yes"');
        }
        if (doc.hasSchoolChildren === 'No' && doc.educationChildren.length > 0) {
            errors.push('educationChildren: must be empty when hasSchoolChildren="No"');
        }
        doc.educationChildren.forEach((c, i) => validateEducationChild(c, i, errors));
    }

    // ── Flag → array: hasUnEmployedMembers ─────────────────────────────────────
    if (!['Yes', 'No'].includes(doc.hasEmployedMembers)) {
        errors.push(`hasEmployedMembers: must be "Yes" or "No" (got "${doc.hasEmployedMembers}")`);
    }
    if (!['Yes', 'No'].includes(doc.hasUnEmployedMembers)) {
        errors.push(`hasUnEmployedMembers: must be "Yes" or "No" (got "${doc.hasUnEmployedMembers}")`);
    }
    if (!isArray(doc.unemployedMembers)) {
        errors.push('unemployedMembers: must be an Array');
    } else {
        if (doc.hasUnEmployedMembers === 'Yes' && doc.unemployedMembers.length === 0) {
            errors.push('unemployedMembers: must be non-empty when hasUnEmployedMembers="Yes"');
        }
        if (doc.hasUnEmployedMembers === 'No' && doc.unemployedMembers.length > 0) {
            errors.push('unemployedMembers: must be empty when hasUnEmployedMembers="No"');
        }
        doc.unemployedMembers.forEach((m, i) => validateUnemployedMember(m, i, errors));
    }

    return { valid: errors.length === 0, errors };
}

module.exports = { validate };
