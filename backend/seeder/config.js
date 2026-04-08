'use strict';

// ─── ENUMS (mirrored from src/models/enum — do not change values) ─────────────

const HEALTH_ISSUES = [
  'Diabetes', 'Hypertension', 'Heart Disease', 'Asthma', 'Tuberculosis',
  'Cancer', 'Kidney Disease', 'Disability', 'Mental Health Issues',
  'Malnutrition', 'Paralysis', 'Pregnancy-related complications', 'Other',
];

const MORBIDITIES = ['Knee Pain', 'Back Pain', 'Leg Pain', 'Joint Pain', 'Paralysis', 'Other'];

const EDUCATION_LEVELS = [
  'Not enrolled', 'Anganwadi', 'Primary', 'Secondary',
  'Higher Secondary', 'ITI / Diploma', 'College', 'Dropout',
];

const SKILLS = [
  '12 Balutedar (बारा बलुतेदार)',
  'Farming', 'Mason', 'Electrician', 'Plumbing', 'Driving',
  'Computer skills', 'Mobile repair', 'Handicrafts', 'Cooking', 'Hardware', 'Other',
];

const UNEMPLOYMENT_REASONS = [
  'No skills', 'Low education', 'Health issue', 'No job opportunities',
  'Financial problems', 'Family responsibilities', 'Migration issue', 'Other',
];

const EMPLOYMENT_STATUS = ['Unemployed', 'Suboptimally Employed'];

const HIGHEST_EDUCATION = ['Illiterate', 'Primary', '10th Pass', '12th Pass', 'Graduate', 'Postgraduate'];

const EDUCATIONAL_ISSUES = [
  'Financial problem', 'Transportation issue', 'Poor academic performance',
  'Dropped out', 'Lack of digital access', 'Lack of books/material',
  'Health issue', 'Family responsibility', 'Other',
];

const AYUSHMAN_STATUS = ['All Members Have', 'Some Members Have', 'None Have'];

const SURVEY_STATUS = ['Submitted', 'Draft', 'Verified', 'Rejected'];

const GENDERS = ['Male', 'Female', 'Other'];

const VILLAGES = [
  'OZAR', 'RAMPUR', 'NASHIK', 'AMBAD', 'SINNAR', 'NIPHAD',
  'YEOLA', 'MANMAD', 'SATANA', 'MALEGAON', 'DINDORI', 'IGATPURI',
  'TRIMBAKESHWAR', 'PETH', 'SURGANA', 'KALVAN', 'BAGLAN', 'CHANDWAD',
];

// ─── INDIAN NAMES ──────────────────────────────────────────────────────────────

const MALE_FIRST_NAMES = [
  'Arjun', 'Rohit', 'Vikas', 'Santosh', 'Mahesh', 'Suresh', 'Ramesh',
  'Ganesh', 'Dinesh', 'Rakesh', 'Naresh', 'Umesh', 'Rajesh', 'Yogesh',
  'Nilesh', 'Prashant', 'Sanjay', 'Vijay', 'Ajay', 'Rajan', 'Prakash',
  'Ashok', 'Deepak', 'Manoj', 'Anil', 'Sunil', 'Kapil', 'Sachin',
  'Kiran', 'Pankaj', 'Amol', 'Vishal', 'Nikhil', 'Akash', 'Abhijit',
  'Sandesh', 'Prasad', 'Omkar', 'Shubham', 'Pratik', 'Rahul', 'Amit',
  'Sumit', 'Kunal', 'Pranav', 'Yash', 'Atharva', 'Tejas', 'Rushikesh',
  'Mangesh', 'Dattatray', 'Balaji', 'Vitthal', 'Pandurang', 'Maruti',
  'Ramshankar', 'Laxman', 'Bhagwan', 'Haribhau', 'Yadav', 'Kishor',
  // Muslim names
  'Arshad', 'Imran', 'Salim', 'Farhan', 'Riyaz', 'Sabir', 'Wasim',
  'Irfan', 'Javed', 'Karim', 'Nazim', 'Shakil', 'Tariq', 'Altaf',
];

const FEMALE_FIRST_NAMES = [
  'Sunita', 'Anita', 'Kavita', 'Savita', 'Rekha', 'Meena', 'Seema',
  'Geeta', 'Lata', 'Mala', 'Asha', 'Usha', 'Nanda', 'Vanda',
  'Priya', 'Pooja', 'Sneha', 'Neha', 'Nisha', 'Swati', 'Pallavi',
  'Madhuri', 'Reshma', 'Varsha', 'Sarita', 'Manisha', 'Amruta',
  'Pratiksha', 'Ashwini', 'Gauri', 'Shraddha', 'Rutuja', 'Tejal',
  'Deepika', 'Archana', 'Vandana', 'Nirmala', 'Sushila', 'Leela',
  'Champa', 'Padma', 'Kamal', 'Shobha', 'Vimala', 'Tara', 'Parvati',
  // Muslim names
  'Fatima', 'Ayesha', 'Zainab', 'Rehana', 'Shabana', 'Nasreen', 'Rubina',
];

const SURNAMES = [
  'Patil', 'Shinde', 'Jadhav', 'Pawar', 'More', 'Gaikwad', 'Bhosale',
  'Deshmukh', 'Kulkarni', 'Deshpande', 'Joshi', 'Patel', 'Shah',
  'Yadav', 'Sharma', 'Verma', 'Gupta', 'Singh', 'Thakur', 'Chauhan',
  'Nair', 'Pillai', 'Iyer', 'Menon', 'Naik', 'Sawant', 'Bagul',
  'Ahire', 'Borse', 'Chavan', 'Dange', 'Gavhane', 'Ingale', 'Kale',
  'Lokhande', 'Mane', 'Nikam', 'Pagar', 'Raut', 'Salve', 'Thokal',
  'Wagh', 'Zope', 'Gavit', 'Sonawane', 'Bhandare', 'Suryawanshi',
  // Muslim surnames
  'Khan', 'Shaikh', 'Qureshi', 'Ansari', 'Siddiqui', 'Pathan',
];

// ─── WEIGHTED DISTRIBUTION TABLES ─────────────────────────────────────────────
// Format: [[value, weight], ...]  — weights are relative (not required to sum to 100)

const DISTRIBUTIONS = {
  representativeGender:   [['Male', 70], ['Female', 28], ['Other', 2]],
  ayushmanStatus:         [['All Members Have', 40], ['Some Members Have', 30], ['None Have', 30]],
  hasHealthIssues:        [['Yes', 50], ['No', 50]],
  hasSchoolChildren:      [['Yes', 45], ['No', 55]],
  hasEmployedMembers:     [['Yes', 60], ['No', 40]],
  hasUnEmployedMembers:   [['Yes', 45], ['No', 55]],
  employmentStatus:       [['Unemployed', 65], ['Suboptimally Employed', 35]],
  surveyStatus:           [['Submitted', 85], ['Draft', 10], ['Verified', 4], ['Rejected', 1]],
  isWhatsApp:             [['Yes', 70], ['No', 20], ['OMIT', 10]],
  healthCount:            [[1, 60], [2, 30], [3, 10]],
  educationCount:         [[1, 55], [2, 35], [3, 10]],
  unemployedCount:        [[1, 60], [2, 30], [3, 10]],
  morbidityCount:         [[0, 55], [1, 30], [2, 15]],
  educIssueCount:         [[0, 40], [1, 35], [2, 20], [3, 5]],
  skillCount:             [[0, 20], [1, 35], [2, 30], [3, 15]],
  familySize:             [[1,3],[2,5],[3,10],[4,15],[5,20],[6,18],[7,12],[8,8],[9,5],[10,2],[11,1],[12,1]],
  // Health issue frequencies – used when selecting which issues to assign
  healthIssueWeights: {
    'Diabetes':                       20,
    'Hypertension':                   18,
    'Heart Disease':                  10,
    'Asthma':                          8,
    'Tuberculosis':                    6,
    'Cancer':                          4,
    'Kidney Disease':                  5,
    'Disability':                      7,
    'Mental Health Issues':            6,
    'Malnutrition':                    5,
    'Paralysis':                       3,
    'Pregnancy-related complications': 5,
    'Other':                           3,
  },
  // Unemployment reason frequencies
  unemploymentReasonWeights: {
    'No job opportunities':  25,
    'Migration issue':        20,
    'No skills':              15,
    'Low education':          15,
    'Health issue':           10,
    'Financial problems':      8,
    'Family responsibilities': 5,
    'Other':                   2,
  },
};

// ─── SEED CONFIG ───────────────────────────────────────────────────────────────

const SEED_CONFIG = {
  TOTAL_DOCS: 500,
  BATCH_SIZE: 50,
  OUTPUT_FILE: './output.json',
  // EDGE_CASE_RATE: how many out of every 10 docs trigger special edge cases
  EDGE_CASE_RATE: 0.08, // ~8%
};

module.exports = {
  HEALTH_ISSUES,
  MORBIDITIES,
  EDUCATION_LEVELS,
  SKILLS,
  UNEMPLOYMENT_REASONS,
  EMPLOYMENT_STATUS,
  HIGHEST_EDUCATION,
  EDUCATIONAL_ISSUES,
  AYUSHMAN_STATUS,
  SURVEY_STATUS,
  GENDERS,
  VILLAGES,
  MALE_FIRST_NAMES,
  FEMALE_FIRST_NAMES,
  SURNAMES,
  DISTRIBUTIONS,
  SEED_CONFIG,
};
