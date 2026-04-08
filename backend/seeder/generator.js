'use strict';

const {
    HEALTH_ISSUES, MORBIDITIES, EDUCATION_LEVELS, SKILLS,
    UNEMPLOYMENT_REASONS, HIGHEST_EDUCATION, EDUCATIONAL_ISSUES,
    GENDERS, VILLAGES,
    MALE_FIRST_NAMES, FEMALE_FIRST_NAMES, SURNAMES,
    DISTRIBUTIONS, SEED_CONFIG,
} = require('./config');

// ─── UTILITY: WEIGHTED RANDOM PICK ────────────────────────────────────────────

/**
 * Picks one value from a weighted distribution table.
 * @param {Array<[any, number]>} table  e.g. [['Yes', 70], ['No', 30]]
 * @returns {*} The selected value
 */
function weightedPick(table) {
    const total = table.reduce((sum, [, w]) => sum + w, 0);
    let rand = Math.random() * total;
    for (const [value, weight] of table) {
        rand -= weight;
        if (rand <= 0) return value;
    }
    return table[table.length - 1][0]; // fallback
}

/**
 * Picks one value from a plain frequency-map object.
 * @param {Object<string, number>} map   e.g. { 'Diabetes': 20, 'Asthma': 8 }
 * @returns {string}
 */
function weightedPickFromMap(map) {
    const table = Object.entries(map);
    return weightedPick(table);
}

/**
 * Picks N unique items from an array using a frequency-map for weighting.
 * Falls back to uniform pick if map is not supplied.
 */
function weightedPickN(pool, n, weightMap = null) {
    const available = [...pool];
    const result = [];
    const maxN = Math.min(n, available.length);
    for (let i = 0; i < maxN; i++) {
        let chosen;
        if (weightMap) {
            // Build a sub-table from remaining items only
            const sub = available.map((v) => [v, weightMap[v] ?? 1]);
            chosen = weightedPick(sub);
        } else {
            chosen = available[Math.floor(Math.random() * available.length)];
        }
        result.push(chosen);
        available.splice(available.indexOf(chosen), 1);
    }
    return result;
}

// ─── UTILITY: RANGE INT ───────────────────────────────────────────────────────

/** Returns a random integer in [min, max] inclusive. */
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── UTILITY: RANDOM NAME ─────────────────────────────────────────────────────

function randomName(gender) {
    const firstPool = gender === 'Female' ? FEMALE_FIRST_NAMES : MALE_FIRST_NAMES;
    const first = firstPool[Math.floor(Math.random() * firstPool.length)];
    const last = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
    return `${first} ${last}`;
}

/** Returns only first name (used for family members where brevity is typical). */
function randomFirstName(gender) {
    const pool = gender === 'Female' ? FEMALE_FIRST_NAMES : MALE_FIRST_NAMES;
    return pool[Math.floor(Math.random() * pool.length)];
}

// ─── UTILITY: RANDOM 10-DIGIT MOBILE NUMBER ───────────────────────────────────

const _usedMobiles = new Set();

function randomMobile() {
    const prefixes = ['6', '7', '8', '9'];
    let mobile;
    do {
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const rest = String(Math.floor(Math.random() * 1_000_000_000)).padStart(9, '0');
        mobile = prefix + rest;
    } while (_usedMobiles.has(mobile));
    _usedMobiles.add(mobile);
    return mobile;
}

// ─── UTILITY: EDUCATION LEVEL FROM AGE ────────────────────────────────────────

function educationLevelFromAge(age) {
    if (age <= 3) return 'Not enrolled';
    if (age <= 5) return 'Anganwadi';
    if (age <= 10) return weightedPick([['Primary', 85], ['Not enrolled', 10], ['Anganwadi', 5]]);
    if (age <= 14) return weightedPick([['Secondary', 80], ['Primary', 10], ['Dropout', 10]]);
    if (age <= 17) return weightedPick([['Higher Secondary', 70], ['Secondary', 15], ['ITI / Diploma', 10], ['Dropout', 5]]);
    if (age <= 20) return weightedPick([['College', 50], ['Higher Secondary', 20], ['ITI / Diploma', 20], ['Dropout', 10]]);
    return weightedPick([['College', 60], ['ITI / Diploma', 20], ['Dropout', 10], ['Higher Secondary', 10]]);
}

// ─── UTILITY: HIGHEST EDUCATION FROM AGE ─────────────────────────────────────

function highestEdFromAge(age) {
    if (age < 18) return weightedPick([['Illiterate', 10], ['Primary', 50], ['10th Pass', 40]]);
    if (age < 22) return weightedPick([['10th Pass', 35], ['12th Pass', 35], ['Primary', 15], ['Illiterate', 10], ['Graduate', 5]]);
    if (age < 30) return weightedPick([['12th Pass', 30], ['Graduate', 30], ['10th Pass', 20], ['Postgraduate', 10], ['Illiterate', 5], ['Primary', 5]]);
    return weightedPick([['12th Pass', 25], ['Graduate', 25], ['10th Pass', 20], ['Illiterate', 15], ['Primary', 10], ['Postgraduate', 5]]);
}

// ─── UTILITY: RANDOM PAST DATE ────────────────────────────────────────────────

/**
 * Returns a random ISO date string within the past `maxDaysAgo` days.
 */
function randomPastDate(maxDaysAgo = 120) {
    const ms = Date.now() - Math.floor(Math.random() * maxDaysAgo * 86_400_000);
    return new Date(ms);
}

// ─── PHASE GENERATORS ─────────────────────────────────────────────────────────

/**
 * Generates representative (Phase 1) fields.
 * @param {import('mongoose').Types.ObjectId[]} surveyorIds
 * @param {{ forceEdge?: boolean }} opts
 */
function generateRepresentative(surveyorIds, villages, { forceEdge = false } = {}) {
    const gender = weightedPick(DISTRIBUTIONS.representativeGender);
    const name = randomName(gender);
    const villageArray = (villages && villages.length > 0) ? villages : VILLAGES;
    const village = villageArray[Math.floor(Math.random() * villageArray.length)];
    const surveyorId = surveyorIds[Math.floor(Math.random() * surveyorIds.length)];

    // Age: weighted toward 28–55, edge-case can be boundary values
    let age;
    if (forceEdge && Math.random() < 0.3) {
        age = Math.random() < 0.5 ? 18 : randInt(90, 120);
    } else {
        age = randInt(18, 80);
        // Bias toward 28–55
        if (Math.random() < 0.65) age = randInt(28, 55);
    }

    const familySize = forceEdge && Math.random() < 0.3
        ? 1
        : Number(weightedPick(DISTRIBUTIONS.familySize));

    const ayushmanStatus = weightedPick(DISTRIBUTIONS.ayushmanStatus);
    let ayushmanMembersCount;
    if (ayushmanStatus === 'Some Members Have') {
        // must be ≥1 and < familySize; if family=1 force "All" or "None"
        if (familySize === 1) {
            // Can't have "Some" in single-member family — override
            // Will be corrected below; set a flag
        } else {
            ayushmanMembersCount = randInt(1, familySize - 1);
        }
    }
    // Fix edge: single member cannot be "Some Members Have"
    const finalAyushman = (ayushmanStatus === 'Some Members Have' && familySize === 1)
        ? (Math.random() < 0.5 ? 'All Members Have' : 'None Have')
        : ayushmanStatus;

    const isWhatsAppRaw = weightedPick(DISTRIBUTIONS.isWhatsApp);

    const doc = {
        representativeName: name,
        mobileNumber: randomMobile(),
        representativeAge: age,
        representativeGender: gender,
        totalFamilyMembers: familySize,
        ayushmanCardStatus: finalAyushman,
        surveyorId,
        village,
        status: weightedPick(DISTRIBUTIONS.surveyStatus),
    };

    // Conditionally include isWhatsAppNumber
    if (isWhatsAppRaw !== 'OMIT') {
        doc.isWhatsAppNumber = isWhatsAppRaw;
    }

    // Conditionally include ayushmanMembersCount
    if (finalAyushman === 'Some Members Have' && ayushmanMembersCount !== undefined) {
        doc.ayushmanMembersCount = ayushmanMembersCount;
    }

    return doc;
}

/**
 * Generates health phase fields.
 * @param {number} familySize
 * @param {{ forceEdge?: boolean }} opts
 */
function generateHealthData(familySize, { forceEdge = false } = {}) {
    const hasHealthIssues = weightedPick(DISTRIBUTIONS.hasHealthIssues);

    if (hasHealthIssues === 'No') {
        return { hasHealthIssues: 'No', healthMembers: [] };
    }

    let count = Number(weightedPick(DISTRIBUTIONS.healthCount));
    if (forceEdge && Math.random() < 0.4) count = 3; // push to max

    const healthMembers = [];
    for (let i = 0; i < count; i++) {
        const gender = weightedPick([['Male', 50], ['Female', 48], ['Other', 2]]);
        const age = forceEdge && Math.random() < 0.2
            ? (Math.random() < 0.5 ? 0 : 100)
            : randInt(1, 80);

        // healthIssueType: always Array (canonical form)
        const issueCount = Math.random() < 0.75 ? 1 : 2;
        const healthIssueType = weightedPickN(
            HEALTH_ISSUES, issueCount, DISTRIBUTIONS.healthIssueWeights
        );

        // hasAdditionalMorbidity: array
        const morbidityCount = Number(weightedPick(DISTRIBUTIONS.morbidityCount));
        const hasAdditionalMorbidity = morbidityCount > 0
            ? weightedPickN(MORBIDITIES, morbidityCount)
            : [];

        const entry = {
            patientName: randomFirstName(gender),
            age,
            gender,
            healthIssueType,
            hasAdditionalMorbidity,
        };

        // 10% chance of otherHealthIssue text
        if (healthIssueType.includes('Other') || Math.random() < 0.08) {
            entry.otherHealthIssue = 'Unspecified condition';
        }

        healthMembers.push(entry);
    }

    return { hasHealthIssues: 'Yes', healthMembers };
}

/**
 * Generates education phase fields.
 * @param {number} familySize
 * @param {{ forceEdge?: boolean }} opts
 */
function generateEducationData(familySize, { forceEdge = false } = {}) {
    // Single-member households cannot have school children
    const canHaveChildren = familySize > 1;
    const hasSchoolChildren = canHaveChildren
        ? weightedPick(DISTRIBUTIONS.hasSchoolChildren)
        : 'No';

    if (hasSchoolChildren === 'No') {
        return { hasSchoolChildren: 'No', educationChildren: [] };
    }

    let count = Number(weightedPick(DISTRIBUTIONS.educationCount));
    count = Math.min(count, familySize - 1); // can't exceed remaining members

    const educationChildren = [];
    for (let i = 0; i < count; i++) {
        const gender = weightedPick([['Male', 50], ['Female', 48], ['Other', 2]]);

        // Age: 4–22; edge cases can be boundary
        let age;
        if (forceEdge && Math.random() < 0.25) {
            age = Math.random() < 0.5 ? 4 : 22;
        } else {
            age = randInt(4, 20);
        }

        const educationLevel = educationLevelFromAge(age);
        const issueCount = Number(weightedPick(DISTRIBUTIONS.educIssueCount));
        const educationalIssues = issueCount > 0
            ? weightedPickN(EDUCATIONAL_ISSUES, issueCount)
            : [];

        const entry = {
            Name: randomFirstName(gender), // capital N — matches Mongoose schema
            age,
            gender,
            educationLevel,
            educationalIssues,
        };

        // 8% chance of otherEducationalIssue
        if (educationalIssues.includes('Other') || Math.random() < 0.08) {
            entry.otherEducationalIssue = 'Other specific issue';
        }

        educationChildren.push(entry);
    }

    return { hasSchoolChildren: 'Yes', educationChildren };
}

/**
 * Generates employment phase fields.
 * @param {{ forceEdge?: boolean }} opts
 */
function generateEmploymentData({ forceEdge = false } = {}) {
    const hasEmployedMembers = weightedPick(DISTRIBUTIONS.hasEmployedMembers);
    const hasUnEmployedMembers = weightedPick(DISTRIBUTIONS.hasUnEmployedMembers);

    if (hasUnEmployedMembers === 'No') {
        return { hasEmployedMembers, hasUnEmployedMembers: 'No', unemployedMembers: [] };
    }

    let count = Number(weightedPick(DISTRIBUTIONS.unemployedCount));
    if (forceEdge && Math.random() < 0.3) count = 3;

    const unemployedMembers = [];
    for (let i = 0; i < count; i++) {
        const gender = weightedPick([['Male', 55], ['Female', 43], ['Other', 2]]);

        let age;
        if (forceEdge && Math.random() < 0.25) {
            age = Math.random() < 0.5 ? 15 : 60;
        } else {
            age = randInt(16, 55);
            if (Math.random() < 0.6) age = randInt(18, 40);
        }

        const employmentStatus = weightedPick(DISTRIBUTIONS.employmentStatus);
        const highestEducation = highestEdFromAge(age);
        const skillCount = Number(weightedPick(DISTRIBUTIONS.skillCount));
        const skillsKnown = skillCount > 0 ? weightedPickN(SKILLS, skillCount) : [];

        const entry = {
            name: randomFirstName(gender), // lowercase n — matches Mongoose schema
            age,
            gender,
            employmentStatus,
            highestEducation,
            skillsKnown,
        };

        // otherSkills: present ~15% as free text
        if (skillsKnown.includes('Other') || Math.random() < 0.15) {
            entry.otherSkills = 'Other locally-known skill';
        }

        // unemploymentReason: REQUIRED when employmentStatus === 'Unemployed'
        if (employmentStatus === 'Unemployed') {
            entry.unemploymentReason = weightedPickFromMap(
                DISTRIBUTIONS.unemploymentReasonWeights
            );
            // otherReason: 8% chance
            if (entry.unemploymentReason === 'Other' || Math.random() < 0.08) {
                entry.otherReason = 'Personal circumstances';
            }
        }
        // employmentStatus === 'Suboptimally Employed' → unemploymentReason omitted (not required)

        unemployedMembers.push(entry);
    }

    return { hasEmployedMembers, hasUnEmployedMembers: 'Yes', unemployedMembers };
}

// ─── FULL DOCUMENT GENERATOR ──────────────────────────────────────────────────

/**
 * Generates one complete survey document.
 * @param {import('mongoose').Types.ObjectId[]} surveyorIds  Pre-fetched from DB.
 * @param {number} index  Document sequence number (used for edge-case injection).
 * @returns {Object} Plain JS object matching HouseholdSurveySchema.
 */
function generateFullDocument(surveyorIds, index, villages) {
    const forceEdge = Math.random() < SEED_CONFIG.EDGE_CASE_RATE;

    const base = generateRepresentative(surveyorIds, villages, { forceEdge });
    const health = generateHealthData(base.totalFamilyMembers, { forceEdge });
    const education = generateEducationData(base.totalFamilyMembers, { forceEdge });
    const employment = generateEmploymentData({ forceEdge });

    const createdAt = randomPastDate(120);
    // updatedAt is createdAt + 0–300 seconds (simulate save events)
    const updatedAt = new Date(createdAt.getTime() + randInt(0, 300) * 1000);

    return {
        ...base,
        ...health,
        ...education,
        ...employment,
        createdAt,
        updatedAt,
    };
}

module.exports = {
    generateRepresentative,
    generateHealthData,
    generateEducationData,
    generateEmploymentData,
    generateFullDocument,
    // Expose utilities for testing
    weightedPick,
    randInt,
};
