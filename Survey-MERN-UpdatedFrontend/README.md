# HOUSEHOLD SURVEY APPLICATION - DETAILED PRS DOCUMENT

## Executive Summary
A comprehensive MERN-stack household survey application designed for government social welfare programs (Ayushman Bharat, educational support, employment schemes). The platform enables trained surveyors to collect socio-economic data across villages with admin oversight, real-time analytics, and secure data management.

**Target Users**: Surveyors (field agents), Admins (program managers), Government officials (data review)

**Deployment Target**: Cloud (AWS/Google Cloud) with mobile-first progressive web app support

---

## 1. System Overview

### 1.1 Architecture
```
Frontend (React + Redux)
    ↓
API Gateway (Express.js)
    ↓
Backend Services (Node.js)
    ↓
Database (MongoDB)
    ↓
External Services (WhatsApp/SMS API, Google Maps)
```

### 1.2 Core Modules
| Module | Purpose | Users |
|--------|---------|-------|
| **Authentication** | Surveyor login, Admin account creation | All |
| **Survey Module** | Data collection via questionnaire | Surveyors |
| **Admin Dashboard** | User management, analytics | Admins |
| **Data Analytics** | Village-wise reports, insights | Admins, Officials |
| **Offline Mode** | Mobile-first data sync | Surveyors |

### 1.3 Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Redux, React Native (optional) |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcryptjs |
| Deployment | Docker, AWS EC2/Lambda |
| Additional | WhatsApp API, Google Maps API |

---

## 2. Functional Requirements

### 2.1 Authentication Module

#### 2.1.1 User Registration (Admin-Only)
**Requirement**: Admin creates surveyor accounts with credentials  
**Scope**:
- Admin dashboard form to create surveyors
- Generate unique username (auto or manual)
- Set temporary password (sent via email/WhatsApp)
- Assign villages (multiple selection)
- Mark surveyor active/inactive

**API Endpoint**: `POST /api/admin/surveyors`  
**Request**:
```json
{
  "username": "surveyor_nashik_001",
  "email": "surveyor@gmail.com",
  "password": "temp_password",
  "assignedVillages": ["Village1", "Village2"],
  "phone": "9876543210"
}
```
**Response**: 201 Created with surveyorId

#### 2.1.2 User Login (Surveyor/Admin)
**Requirement**: Secure login with JWT token generation  
**Scope**:
- Username + password authentication
- Password validation with bcrypt (12 salt rounds)
- JWT token generation (7-day expiry)
- Return assigned villages for surveyor
- Track login timestamps

**API Endpoint**: `POST /api/auth/login`  
**Request**:
```json
{
  "username": "surveyor_nashik_001",
  "password": "temp_password"
}
```
**Response**: 200 OK with JWT token + user details

#### 2.1.3 OTP-Based Mobile Login (Future)
**Requirement**: WhatsApp/SMS OTP for surveyor mobile app  
**Scope**:
- Send 6-digit OTP to registered phone
- OTP validity: 10 minutes
- Max 3 retry attempts
- Verify OTP → generate JWT token
- Track OTP attempts for security

**API Endpoints**:
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP

#### 2.1.4 Password Management
**Requirement**: First-time password change + reset  
**Scope**:
- Force password change on first login
- Password strength validation (min 8 chars, special chars, numbers)
- Forgot password via email link
- Token-based reset (24-hour validity)

**API Endpoints**:
- `POST /api/auth/change-password`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password/:token`

---

### 2.2 Survey Data Collection Module

#### 2.2.1 Survey Creation & Management
**Requirement**: Surveyors create and edit household surveys  
**Scope**:
- Create new survey (auto-assigned to surveyor + village)
- Save draft (no validation required initially)
- Update any section before submission
- Submit completed survey (locked after submission)
- Can view previously submitted surveys (read-only)

**API Endpoints**:
- `POST /api/surveys` - Create survey
- `GET /api/surveys` - List (with filters)
- `GET /api/surveys/:id` - Get single survey
- `PUT /api/surveys/:id` - Update draft
- `PATCH /api/surveys/:id/submit` - Submit survey

#### 2.2.2 Phase 1: Household Basic Information
**Fields**:
- Representative name (required, text)
- Mobile number (required, 10-digit, regex validation)
- Age (required, number, range 0-120)
- Gender (required, radio: Male/Female/Other)
- Total family members (required, number, range 1-50)
- Ayushman Bharat card status (required, radio)
- If "Some Members Have": Count with number input (≤ total members)

**Validation Rules**:
```
representativeName: /^[a-zA-Z\s]{2,100}$/
mobileNumber: /^[0-9]{10}$/
totalFamilyMembers: 1 ≤ x ≤ 50
ayushmanCardCount: ≤ totalFamilyMembers
```

#### 2.2.3 Phase 2: Healthcare Section (Repeatable)
**Trigger**: If "Is anyone facing health issues?" = Yes  
**Repeatable for**: Each affected family member  
**Fields per member**:
- Patient name (text, required)
- Age (number, 0-120, required)
- Gender (radio, required)
- Health issue type (dropdown, required, with "Other" option)
- Has additional morbidity (radio: Yes/No)
- Additional morbidity details (text, conditional on Yes)

**Health Issue Types**:
```
Diabetes, Hypertension, Heart Disease, Asthma, Tuberculosis, Cancer,
Kidney Disease, Disability, Mental Health Issues, Malnutrition,
Pregnancy-related complications, Other (specify)
```

**UI Pattern**: "Add Another Member" button to repeat section, max 20 members

#### 2.2.4 Phase 3: Education Section (Repeatable)
**Trigger**: If "Are there school/college-going children?" = Yes  
**Repeatable for**: Each child in education  
**Fields per child**:
- Child name (text, required)
- Age (number, 3-35, required)
- Gender (radio, required)
- Current education level (dropdown, required)
- Has educational issues (radio: Yes/No)
- If Yes: Type of issue (multi-select checkbox with 9 options)
- Aware of government schemes (radio: Yes/No/Heard but don't know)

**Education Levels**:
```
Not enrolled, Anganwadi, Primary, Secondary, Higher Secondary,
ITI/Diploma, College, Dropout
```

**Educational Issues**:
```
Financial problem, Transportation issue, Poor academic performance,
Dropped out, Lack of digital access, Lack of books/material,
Health issue, Family responsibility, Other (specify)
```

**UI Pattern**: Multi-select with "Other (Specify)" text field, max 15 children

#### 2.2.5 Phase 4A: Employment Section - Employed Members (Repeatable)
**Trigger**: If "Is at least one member employed?" = Yes  
**Repeatable for**: Each employed member  
**Fields per member**:
- Name (text, required)
- Age (number, 18-80, required)
- Gender (radio, required)
- Employment type (dropdown, required)

**Employment Types**:
```
Farming, Daily wage labor, Government job, Private job,
Self-employed, Skilled labor, Business owner, Migrant worker, Other
```

**UI Pattern**: "Add Another Employed Member" button, max 10 members

#### 2.2.6 Phase 4B: Unemployment Section - Unemployed Members (Repeatable)
**Trigger**: Show if unemployed members exist  
**Repeatable for**: Each unemployed adult member  
**Fields per member**:
- Name (text, required)
- Age (number, 18-80, required)
- Gender (radio, required)
- Highest education (dropdown, required)
- Skills known (multi-select checkbox, 22 options)
- Main reason for unemployment (dropdown, required)

**Education Levels**:
```
Illiterate, Primary, 10th Pass, 12th Pass, Graduate, Postgraduate
```

**Skills (Traditional + Modern)**:
```
Traditional 12 Balutedar:
  Sutar (Carpenter), Lohar (Blacksmith), Kumbhar (Potter), Nhavi (Barber),
  Parit (Washerman), Gurav (Temple Servant), Jotish (Astrologer/Priest),
  Sonar (Goldsmith), Chambhar (Cobbler/Leather worker), Mali (Gardener),
  Mang (Village Messenger/Security), Teli (Oil Presser)

Other Skills:
  Farming, Mason, Electrician, Plumbing, Driving, Computer skills,
  Mobile repair, Handicrafts, Cooking, Hardware
```

**Unemployment Reasons**:
```
No skills, Low education, Health issue, No job opportunities,
Financial problems, Family responsibilities, Migration issue, Other
```

#### 2.2.7 Survey Metadata
**Auto-captured**:
- Survey ID (unique MongoDB ObjectId)
- Surveyor ID (from JWT token)
- Village name (validated against surveyor's assignments)
- Survey date (current timestamp)
- Status (Draft → Submitted → Verified)
- GPS location (latitude/longitude, optional)
- Timestamps (created, updated)

---

### 2.3 Admin Dashboard Module

#### 2.3.1 Surveyor Management
**Requirement**: Admin creates, edits, deactivates surveyors  
**Functionality**:
- View list of all surveyors (paginated, 10 per page)
- Create new surveyor (with villages assignment)
- Edit surveyor details (name, email, phone)
- Assign/remove villages from surveyor
- Deactivate surveyor (soft delete, preserve data)
- View surveyor performance (surveys submitted, completion rate)
- Reset surveyor password (send reset link)

**API Endpoints**:
- `GET /api/admin/surveyors?page=1&limit=10`
- `POST /api/admin/surveyors`
- `PUT /api/admin/surveyors/:id`
- `PUT /api/admin/surveyors/:id/villages`
- `PATCH /api/admin/surveyors/:id/deactivate`

#### 2.3.2 Village Management
**Requirement**: Manage village assignments  
**Functionality**:
- Create village master data
- Assign multiple surveyors per village
- View village survey progress (e.g., 45/100 households surveyed)
- Edit village metadata (population estimates, landmark)

**API Endpoints**:
- `GET /api/admin/villages`
- `POST /api/admin/villages`
- `PUT /api/admin/villages/:id/surveyors`

#### 2.3.3 Dashboard Analytics
**Requirement**: Real-time metrics and insights  
**Key Metrics**:
```
- Total surveys: Draft/Submitted/Verified counts
- Surveyors active: Count with last login timestamp
- Villages covered: Count of villages with ≥1 survey
- Households surveyed: Running total
- Completion rate: (Submitted surveys / Target) × 100%
- Average survey time: Minutes per survey
```

**Visualizations**:
- Line chart: Daily survey submissions (last 30 days)
- Pie chart: Survey status distribution
- Bar chart: Top 10 surveyors by submission count
- Map: Village-wise coverage (if Google Maps integrated)

**Filters**:
- Date range (from/to date picker)
- Village selection (dropdown multi-select)
- Surveyor selection (dropdown)
- Survey status (Draft/Submitted/Verified)

**API Endpoint**: `GET /api/admin/dashboard?startDate=2026-01-01&endDate=2026-02-20&village=nashik`

#### 2.3.4 Data Verification & Approval
**Requirement**: Admin approves submitted surveys  
**Functionality**:
- View submitted surveys (status = "Submitted")
- Reject survey with feedback message
- Approve survey (status = "Verified")
- Add verification notes
- Flag data quality issues (duplicate phone, suspicious values)

**API Endpoints**:
- `PATCH /api/admin/surveys/:id/approve`
- `PATCH /api/admin/surveys/:id/reject` (with reason)

---

### 2.4 Data Export & Reports Module

#### 2.4.1 Export Functionality
**Requirement**: Export surveys to multiple formats  
**Formats**:
- CSV (Excel-compatible, UTF-8 encoded)
- JSON (nested structure matching MongoDB docs)
- PDF (formatted report with summary statistics)
- Excel (.xlsx with multiple sheets per phase)

**Export Scope**:
- All surveys (filtered by date range, village, status)
- Single survey (full details)
- Aggregated statistics by village

**API Endpoint**: `GET /api/admin/surveys/export?format=csv&startDate=2026-01-01`

#### 2.4.2 Report Generation
**Pre-built Reports**:
1. **Village Summary Report**: 
   - Total households, family members count
   - Health issues prevalence (counts by type)
   - Education statistics (enrollment by level)
   - Employment statistics (types & counts)

2. **Ayushman Bharat Coverage Report**:
   - Households with full coverage
   - Partial coverage households
   - Uncovered households
   - Eligibility gaps

3. **Educational Gap Analysis**:
   - Out-of-school children count
   - Dropout reasons distribution
   - Financial barriers quantified

4. **Employment Landscape**:
   - Unemployment rate by village
   - Skill distribution
   - Informal vs formal employment ratio

**API Endpoint**: `GET /api/admin/reports/:reportType?village=nashik`

---

### 2.5 Offline Mode & Sync (Mobile-First)

#### 2.5.1 Offline Data Storage
**Requirement**: Surveyors collect data without internet  
**Implementation**:
- IndexedDB for local survey drafts
- Service Worker caching API responses
- Background sync queue for pending submissions
- Conflict resolution (server version wins on sync)

**Scope**:
- Store up to 500 survey drafts locally
- Cache village list (auto-refresh daily)
- Queue submissions when offline

#### 2.5.2 Sync Protocol
**When online**:
- Auto-sync queued surveys (FIFO order)
- Download latest master data (villages, updated health options)
- Pull user permissions (in case villages reassigned)

**Sync Endpoint**: `POST /api/surveys/sync` (batch of surveys)

**Conflict Handling**:
```
IF local draft modified after last sync
  AND server has newer version (from admin edit)
THEN server version used (admin data takes precedence)
```

---

### 2.6 Notifications & Alerts

#### 2.6.1 Surveyor Notifications
**Types**:
- Village assignment notification (email + SMS)
- Password reset confirmation
- Survey submitted successfully
- Survey rejected (with admin feedback)
- Village reassignment (new villages added)

**Delivery**: Email (primary), WhatsApp (backup for phone)

#### 2.6.2 Admin Alerts
**Types**:
- High survey submission rate milestone (e.g., 500 surveys submitted)
- Data quality issues detected (duplicate phone numbers)
- Inactive surveyors (no login in 7 days)
- System errors (DB connection issues)

**Delivery**: In-app notification, Email digest (daily)

---

## 3. Non-Functional Requirements

### 3.1 Performance
| Metric | Target |
|--------|--------|
| API response time | < 200ms (p95) |
| Page load time | < 2s (mobile), < 1s (desktop) |
| Database query | < 100ms for typical queries |
| Concurrent users | 500+ surveyors simultaneous |
| Offline mode latency | < 50ms (local IndexedDB reads) |

### 3.2 Security
**Authentication**:
- JWT expiry: 7 days (surveyor), 30 days (admin)
- Password: Min 8 chars, uppercase, number, special char
- Bcrypt: 12 salt rounds for hashing
- HTTPS only in production

**Authorization**:
- Surveyors can ONLY access villages assigned to them
- Surveyors cannot modify submitted surveys
- Admins have full access (RBAC enforced)

**Data Protection**:
- MongoDB: Mongoose validation on insert/update
- Input sanitization: XSS protection via DOMPurify (frontend)
- SQL injection: Not applicable (NoSQL), but parameterized queries used
- CORS: Whitelist frontend origin only
- Rate limiting: 100 requests/min per IP

**Audit Trail**:
- Log all admin actions (create surveyor, delete survey, etc.)
- Track survey submission timestamps
- Store IP address of login attempts

### 3.3 Scalability
**Horizontal Scaling**:
- Stateless API (no session storage)
- Load balancer (AWS ALB) routes to multiple Express servers
- MongoDB replica set for redundancy

**Database Optimization**:
- Indexes on `surveyorId`, `village`, `status`, `surveyDate`
- Data archival: Surveys older than 2 years moved to cold storage
- Pagination for list endpoints (max 100 per page)

### 3.4 Availability
**Target**: 99.5% uptime  
**Implementation**:
- Auto-scaling: Scale up/down based on CPU/memory
- Health checks: Every 30 seconds
- Backup: Daily automated MongoDB snapshots (retention: 30 days)
- Disaster recovery: RTO 4 hours, RPO 1 hour

### 3.5 Maintainability
**Code Quality**:
- ESLint configuration (Airbnb style guide)
- Prettier for auto-formatting
- Jest unit tests (target: 80% coverage)
- GitHub PR reviews before merge

**Documentation**:
- API documentation (Swagger/OpenAPI)
- Code comments for complex logic
- Deployment runbook
- Change log (semantic versioning)

### 3.6 Accessibility (WCAG 2.1 AA)
- Color contrast: 4.5:1 for normal text
- Keyboard navigation: Tab order logical
- Alt text for all images
- Form labels associated with inputs
- Error messages clear and actionable

### 3.7 Localization
**Languages**: English (primary), Hindi (future)
**Implementation**:
- i18n library (react-i18next)
- Language toggle in header
- All UI text externalized to translation files

---

## 4. UI/UX Requirements

### 4.1 Surveyor Mobile Interface
**Key Screens**:
1. **Login Screen**
   - Username/password input
   - "Forgot Password?" link
   - OTP option (WhatsApp)

2. **Dashboard**
   - "Start New Survey" button
   - List of recent surveys (card view)
   - Filter: By village, status (Draft/Submitted)
   - Sync status indicator

3. **Survey Form**
   - Progressive disclosure (show next phase on completion)
   - Save button (every phase auto-saves to IndexedDB)
   - Progress bar (current phase / 4)
   - Conditional fields (health issues shown only if "Yes")

4. **Survey Review**
   - Read-only summary of all entered data
   - Edit button (only for Draft surveys)
   - Submit button (confirmation modal with disclaimer)

5. **Previous Surveys**
   - List view with timestamp, village, family name
   - Can view (read-only) but not edit submitted surveys

### 4.2 Admin Web Interface
**Key Screens**:
1. **Login Screen** (same as surveyor but for admin)

2. **Dashboard**
   - 4 KPI cards (Total surveys, Active surveyors, Villages, Completion %)
   - Line chart: Daily submissions (last 30 days)
   - Pie chart: Status distribution
   - Filters (date range, village, surveyor)

3. **Surveyor Management**
   - Table: Name, Villages, Last login, Status
   - Bulk actions (select multiple, deactivate all)
   - Create button → Modal form

4. **Survey Verification**
   - Submitted surveys list
   - Approve/Reject buttons with modal
   - Full survey view (all phases)

5. **Reports**
   - Dropdown: Select report type
   - Generate button → Download modal
   - Preview statistics before export

### 4.3 Design System
**Colors**:
- Primary: #2196F3 (Blue) - CTAs
- Success: #4CAF50 (Green) - Approve
- Error: #F44336 (Red) - Reject
- Background: #F5F5F5 (Light Gray)
- Text: #333333 (Dark Gray)

**Typography**:
- Headings: Roboto Bold 24px
- Body: Roboto Regular 14px
- Labels: Roboto Medium 12px

**Spacing**: 8px grid system (8, 16, 24, 32px padding/margins)

---

## 5. Data Models & Schema

### 5.1 Core Collections
**Users Collection**:
```javascript
{
  _id: ObjectId,
  username: String (unique),
  password: String (hashed),
  role: 'admin' | 'surveyor',
  email: String,
  phone: String,
  assignedVillages: [String],
  isActive: Boolean,
  lastLogin: Date,
  createdBy: ObjectId (admin who created),
  createdAt: Date,
  updatedAt: Date
}
```

**Villages Collection**:
```javascript
{
  _id: ObjectId,
  name: String (unique),
  population: Number,
  assignedSurveyors: [ObjectId (ref: User)],
  totalHouseholds: Number,
  surveyedHouseholds: Number,
  createdAt: Date
}
```

**HouseholdSurveys Collection**: (See previous schema response for full nested structure)

---

## 6. API Specification

### 6.1 Authentication Endpoints
```
POST /api/auth/login
POST /api/auth/register (admin-only)
POST /api/auth/send-otp
POST /api/auth/verify-otp
POST /api/auth/change-password
POST /api/auth/forgot-password
POST /api/auth/reset-password/:token
POST /api/auth/logout
```

### 6.2 Survey Endpoints
```
GET    /api/surveys (list, paginated, filtered)
POST   /api/surveys (create)
GET    /api/surveys/:id (get single)
PUT    /api/surveys/:id (update draft)
PATCH  /api/surveys/:id/submit (finalize)
DELETE /api/surveys/:id (admin-only, soft delete)
POST   /api/surveys/sync (batch sync for offline)
GET    /api/surveys/export?format=csv
```

### 6.3 Admin Endpoints
```
GET    /api/admin/surveyors (list)
POST   /api/admin/surveyors (create)
PUT    /api/admin/surveyors/:id (edit)
PUT    /api/admin/surveyors/:id/villages (assign)
PATCH  /api/admin/surveyors/:id/deactivate
GET    /api/admin/dashboard (analytics)
GET    /api/admin/villages (list)
POST   /api/admin/villages (create)
PATCH  /api/admin/surveys/:id/approve (verify)
PATCH  /api/admin/surveys/:id/reject (with reason)
GET    /api/admin/reports/:reportType (generate)
```

### 6.4 Villages Endpoints
```
GET /api/villages/mine (surveyor's assigned)
GET /api/villages (all, admin-only)
```

---

## 7. Testing Strategy

### 7.1 Unit Tests
**Target**: 80% code coverage  
**Scope**:
- Auth controller: Register, login, OTP validation
- Survey controller: CRUD operations, permissions
- Validation middleware: Input sanitization
- Utility functions: Data transformation

**Framework**: Jest + Supertest

### 7.2 Integration Tests
**Scope**:
- End-to-end survey workflow (create → update → submit)
- Admin surveyor management (create → assign → deactivate)
- Data export functionality
- Offline sync protocol

### 7.3 Performance Tests
- Load test: 100 concurrent surveyors submitting
- Response time profiling (API endpoints)
- Database query optimization

### 7.4 Security Tests
- SQL injection attempts (via input fields)
- XSS payload injection
- JWT token expiry validation
- CORS policy enforcement

---

## 8. Deployment & DevOps

### 8.1 Environment Configuration
**Development**: Local MongoDB, localhost:5000  
**Staging**: AWS RDS MongoDB, internal DNS  
**Production**: MongoDB Atlas cluster, AWS Lambda/EC2

### 8.2 CI/CD Pipeline
```
Git push → GitHub Actions
    ↓
Lint check (ESLint) → Unit tests (Jest) → Build Docker image
    ↓
Push to ECR → Deploy to ECS (Fargate)
    ↓
Health checks → Smoke tests → Release notes
```

### 8.3 Monitoring & Logging
- CloudWatch: Request logs, error tracking
- Sentry: Exception aggregation
- DataDog: Performance metrics
- Alerts: Slack notifications on critical errors

### 8.4 Backup & Recovery
- Automated MongoDB backups (daily, 30-day retention)
- Point-in-time restore capability
- Cross-region replication (disaster recovery)

---

## 9. Release & Rollout Plan

### 9.1 Phase 1 (MVP - Month 1)
- Core survey collection (Phase 1-4 questionnaire)
- Surveyor login + offline mode
- Basic admin dashboard
- CSV export

**Target**: 10 surveyors, 100 surveys collected

### 9.2 Phase 2 (Enhancement - Month 2)
- OTP-based mobile login
- Advanced analytics & reports
- Surveyor performance tracking
- Data verification workflow

**Target**: 50 surveyors, 5000 surveys

### 9.3 Phase 3 (Scale - Month 3+)
- Multi-language support (Hindi)
- API for government integration
- Mobile app (React Native)
- Real-time GPS tracking (optional)

**Target**: 500+ surveyors, 100k+ surveys

---

## 10. Success Metrics & KPIs

| Metric | Target | Measurement |
|--------|--------|------------|
| Surveyor adoption | >80% of assigned surveyors active | Login count/month |
| Data accuracy | <1% duplicate records | Phone number duplication check |
| Survey completion | >90% submitted surveys | Status = "Submitted" or "Verified" |
| System uptime | >99.5% | Monitoring dashboard |
| Avg survey time | <15 minutes per household | Timestamp difference |
| User satisfaction | >4.2/5 stars | In-app feedback form |

---

## 11. Risk Analysis & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Surveyors skip required fields | High | Medium | Client-side + server validation, UI hints |
| Data loss (offline → sync) | Low | High | Duplicate local backup before sync, conflict resolution |
| Server downtime during peak | Medium | High | Load balancer + auto-scaling, 99.5% SLA |
| Password compromise | Low | High | 2FA, password reset enforcement, audit logging |
| Poor data quality (intentional) | Medium | Medium | Admin verification workflow, spot-check samples |

---

## 12. Acceptance Criteria

### 12.1 Functional Acceptance
- [ ] All 4 survey phases collect data per specification
- [ ] Surveyor can create, save, and submit survey
- [ ] Admin can create surveyor and assign villages
- [ ] Offline mode stores ≥100 surveys locally
- [ ] Survey export in CSV/JSON/PDF formats
- [ ] Dashboard displays real-time analytics (refresh <5 seconds)

### 12.2 Non-Functional Acceptance
- [ ] API response time <200ms (p95)
- [ ] Page load time <2s on 4G mobile
- [ ] 500 concurrent users supported without errors
- [ ] WCAG 2.1 AA accessibility compliance
- [ ] 80%+ code coverage with unit tests

### 12.3 Security Acceptance
- [ ] All passwords hashed with bcrypt (12 rounds)
- [ ] JWT token validated on protected routes
- [ ] Surveyor can only access assigned villages
- [ ] Admin audit trail logs all actions
- [ ] HTTPS enforced in production

---

**Document Version**: 1.0  
**Last Updated**: February 20, 2026  
**Status**: Approved for Development