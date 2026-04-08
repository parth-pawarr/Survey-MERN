'use strict';
const docs = require('./output.json');
let pass = 0, fail = 0;
const check = (cond, msg) => {
    if (!cond) { console.error('FAIL: ' + msg); fail++; } else { pass++; }
};

docs.forEach((d, i) => {
    const p = `doc[${i}]`;
    check(/^\d{10}$/.test(d.mobileNumber), `${p} mobileNumber format`);
    check(d.representativeAge >= 18 && d.representativeAge <= 120, `${p} representativeAge range`);
    check(d.totalFamilyMembers >= 1 && d.totalFamilyMembers <= 50, `${p} totalFamilyMembers range`);
    check(['Male', 'Female', 'Other'].includes(d.representativeGender), `${p} representativeGender enum`);
    check(['All Members Have', 'Some Members Have', 'None Have'].includes(d.ayushmanCardStatus), `${p} ayushmanCardStatus enum`);
    check(['Submitted', 'Draft', 'Verified', 'Rejected'].includes(d.status), `${p} status enum`);

    if (d.ayushmanCardStatus === 'Some Members Have') {
        check(typeof d.ayushmanMembersCount === 'number', `${p} ayushmanMembersCount present`);
        check(d.ayushmanMembersCount >= 1 && d.ayushmanMembersCount < d.totalFamilyMembers, `${p} ayushmanMembersCount in range`);
    } else {
        check(!('ayushmanMembersCount' in d), `${p} ayushmanMembersCount absent`);
    }

    if (d.hasHealthIssues === 'Yes') check(d.healthMembers.length > 0, `${p} healthMembers non-empty`);
    if (d.hasHealthIssues === 'No') check(d.healthMembers.length === 0, `${p} healthMembers empty`);
    if (d.hasSchoolChildren === 'Yes') check(d.educationChildren.length > 0, `${p} educationChildren non-empty`);
    if (d.hasSchoolChildren === 'No') check(d.educationChildren.length === 0, `${p} educationChildren empty`);
    if (d.hasUnEmployedMembers === 'Yes') check(d.unemployedMembers.length > 0, `${p} unemployedMembers non-empty`);
    if (d.hasUnEmployedMembers === 'No') check(d.unemployedMembers.length === 0, `${p} unemployedMembers empty`);

    d.healthMembers.forEach((h, j) => {
        check(Array.isArray(h.healthIssueType), `${p}.healthMembers[${j}].healthIssueType is Array`);
        check(Array.isArray(h.hasAdditionalMorbidity), `${p}.healthMembers[${j}].hasAdditionalMorbidity is Array`);
        check(h.age >= 0 && h.age <= 120, `${p}.healthMembers[${j}].age range`);
        check(['Male', 'Female', 'Other'].includes(h.gender), `${p}.healthMembers[${j}].gender enum`);
    });

    d.educationChildren.forEach((c, j) => {
        check(typeof c.Name === 'string', `${p}.educationChildren[${j}].Name is string (capital N)`);
        check(c.age >= 0 && c.age <= 25, `${p}.educationChildren[${j}].age range`);
        check(Array.isArray(c.educationalIssues), `${p}.educationChildren[${j}].educationalIssues is Array`);
    });

    d.unemployedMembers.forEach((u, j) => {
        check(['Unemployed', 'Suboptimally Employed'].includes(u.employmentStatus), `${p}.unemployedMembers[${j}].employmentStatus enum`);
        if (u.employmentStatus === 'Unemployed') check(!!u.unemploymentReason, `${p}.unemployedMembers[${j}].unemploymentReason required`);
        check(Array.isArray(u.skillsKnown), `${p}.unemployedMembers[${j}].skillsKnown is Array`);
        check(u.age >= 15 && u.age <= 100, `${p}.unemployedMembers[${j}].age range`);
    });
});

console.log('\n=== Validation Summary ===');
console.log('PASS: ' + pass);
console.log('FAIL: ' + fail);
process.exit(fail > 0 ? 1 : 0);
