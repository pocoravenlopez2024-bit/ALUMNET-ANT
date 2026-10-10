# St. Cecilia's College Alumni Network — Default Accounts & Credentials Matrix

> **Security & Implementation Notice**:
> In compliance with institutional security and credential hygiene standards, default and test credentials are no longer exposed on the public web login interface. All pre-configured institutional test accounts and administrative credentials are documented exclusively in this reference file for authorized developers, testers, and administrative auditors.

---

## 1. Quick Reference Credentials Matrix

All institutional test accounts utilize secured authentication credentials managed via the institutional secrets engine.

```
Security Notice: Default plaintext passwords have been redacted. Authorized auditors authenticate using institutional single-sign-on or environment staging keys.
```

| Role | Display Name | Email / Login Identifier | Student / Employee ID | Primary Workspace |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | Dr. Emmanuel C. Salcedo | `superadmin@stcecilia.edu.ph` | `SCC-SUP-001` | Executive Security & Full Governance Suite |
| **Administrator** | Prof. Teresa B. Carreon | `admin@stcecilia.edu.ph` | `SCC-ADM-002` | Alumni Affairs & Operations Panel |
| **University Registrar** | Atty. Dominic R. Villacarlos | `registrar@stcecilia.edu.ph` | `SCC-REG-003` | Student Registry & Records Verification |
| **Academic Staff** | Bernadette M. Castro | `staff@stcecilia.edu.ph` | `SCC-STF-004` | Events Logistics, Reunions & Gallery |
| **Moderator** | Engr. Christian Dave Oporto | `moderator@stcecilia.edu.ph` | `SCC-MOD-005` | Community Standards & Job Moderation |
| **Employer Partner** | Celeste V. Ramirez | `employer@stcecilia.edu.ph` | *MetroCebu InnovateCorp* | Employer Dashboard & Job Postings |
| **Verified Alumnus** | Julian Marc S. Villareal | `alumni@stcecilia.edu.ph` | `SCC-2019-1082` | Alumni Member Portal & Directory |
| **Alumna (Finance)** | Patricia Mae G. Solon | `patricia.solon@alumni.stcecilia.edu.ph` | `SCC-2018-0541` | Alumni Member Portal & Directory |
| **Alumnus (CpE)** | Anton Luis K. Del Rosario | `anton.delrosario@alumni.stcecilia.edu.ph` | `SCC-2020-0319` | Alumni Member Portal & Directory |

---

## 2. Detailed Account Specifications & Role Capabilities

### 👑 Super Admin
- **Name**: Dr. Emmanuel C. Salcedo
- **Email**: `superadmin@stcecilia.edu.ph`
- **Employee ID**: `SCC-SUP-001`
- **Department**: Office of the Executive President & IT Directorate
- **Capabilities & Permissions**:
  - Full system governance and security audit log inspection.
  - Emergency database snapshots and manual export triggers.
  - User promotion, demotion, role reassignments, and account suspensions.
  - Institutional policy management and security configuration controls.
  - Unrestricted access across all operational modules.

---

### 🛡️ Administrator (Alumni Affairs)
- **Name**: Prof. Teresa B. Carreon
- **Email**: `admin@stcecilia.edu.ph`
- **Employee ID**: `SCC-ADM-002`
- **Department**: Institutional Advancement & Alumni Operations
- **Capabilities & Permissions**:
  - Broadcast institutional announcements and collegiate newsletters.
  - Create, publish, reschedule, and manage alumni events and reunions.
  - Review and manage alumni directory members and employer partnerships.
  - Access alumni engagement metrics, statistics, and career survey trends.

---

### 📜 University Registrar
- **Name**: Atty. Dominic R. Villacarlos
- **Email**: `registrar@stcecilia.edu.ph`
- **Employee ID**: `SCC-REG-003`
- **Department**: Office of the University Registrar
- **Capabilities & Permissions**:
  - Academic masterlist management and CSV student record bulk importer.
  - Registry matcher: verify, approve, or flag student identity claims.
  - Resolve registration conflicts and student ID duplication disputes.
  - Issue official digital alumni verification credentials and status flags.

---

### 📋 Academic Staff & Events Coordinator
- **Name**: Bernadette M. Castro
- **Email**: `staff@stcecilia.edu.ph`
- **Employee ID**: `SCC-STF-004`
- **Department**: Campus Operations, Logistics & Regional Chapters
- **Capabilities & Permissions**:
  - Event check-in management and QR attendance monitoring.
  - Campus photo gallery curation and campus heritage item uploads.
  - Logistics tracking for regional alumni chapters and reunions.
  - General staff-level announcements and event coordination.

---

### ⚖️ Community Standards & Career Moderator
- **Name**: Engr. Christian Dave Oporto
- **Email**: `moderator@stcecilia.edu.ph`
- **Employee ID**: `SCC-MOD-005`
- **Department**: Community Standards & Career Placement Bureau
- **Capabilities & Permissions**:
  - Moderation queue for pending employer job postings and opportunities.
  - Review user reports and community flag escalations.
  - Enforce institutional guidelines on public comments and forum boards.

---

### 🏢 Employer Partner
- **Name**: Celeste V. Ramirez
- **Email**: `employer@stcecilia.edu.ph`
- **Company**: MetroCebu InnovateCorp
- **Industry**: Software Engineering & Digital Transformation
- **Capabilities & Permissions**:
  - Post and manage career opportunities, internships, and job openings.
  - Review candidate applications submitted by verified alumni.
  - Maintain corporate partner profile and contact credentials.

---

### 🎓 Verified Alumni Members

#### 1. Julian Marc S. Villareal (Lead Alumnus Profile)
- **Email**: `alumni@stcecilia.edu.ph`
- **Student ID**: `SCC-2019-1082` *(Login via Email or Student ID)*
- **Alumni ID**: `SCC-ALUM-2023-1082`
- **Degree**: BS in Information Technology (Class of 2023, Magna Cum Laude)
- **Position**: Lead Full-Stack Cloud Engineer at Archipelagic Cloud Systems
- **Features**: Fully populated career timeline, digital alumni ID card, event RSVPs, and direct messaging.

#### 2. Patricia Mae G. Solon
- **Email**: `patricia.solon@alumni.stcecilia.edu.ph`
- **Student ID**: `SCC-2018-0541`
- **Alumni ID**: `SCC-ALUM-2022-0541`
- **Degree**: BS in Business Administration (Financial Management, Class of 2022)
- **Position**: Senior Financial Analyst at Metro Cebu Capital Partners

#### 3. Anton Luis K. Del Rosario
- **Email**: `anton.delrosario@alumni.stcecilia.edu.ph`
- **Student ID**: `SCC-2020-0319`
- **Alumni ID**: `SCC-ALUM-2024-0319`
- **Degree**: BS in Computer Engineering (Class of 2024)

---

## 3. How to Sign In

1. Open the application and navigate to the **Sign In** screen.
2. Select your preferred login method:
   - **Email Address**: Enter any of the authorized email identifiers listed above (e.g., `admin@stcecilia.edu.ph`).
   - **Student ID**: For alumni accounts, toggle to *Student ID* and enter the corresponding ID (e.g., `SCC-2019-1082`).
3. Enter your account password.
4. Click **Sign In**. The portal will authenticate your session and automatically route you to the appropriate workspace (Administrative Console, Employer Dashboard, or Alumni Member Portal).
