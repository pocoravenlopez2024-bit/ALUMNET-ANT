# St. Cecilia's College Alumni Network - Security Specification

## Overview
This specification details the hardened security posture, data invariants, authorization matrix, and validation rules governing the St. Cecilia's College Alumni Portal across Firestore Row-Level Security (RLS) and server-side Express API barriers.

---

## 1. Data Invariants

1. **User Identity & Role Immutability**:
   - Only administrative actors (`isStaffOrAdmin()`) can promote or assign privileged roles (`superadmin`, `admin`, `registrar`, `staff`, `moderator`).
   - Normal users can only register as `alumni` or `employer`.
   - Normal users cannot set `isVerified: true` upon profile creation.
   - User account documents (`/users/{userId}`) must never store or expose plain text passwords.
2. **Student & Registrar Accreditation**:
   - Alumni account self-registration strictly requires validation of an official student ID conforming to `SCC-YYYY-XXXX`.
   - Registrar records in `/registry_records` can only be authored or modified by accredited registrars (`isRegistrar()`).
3. **Attendee & RSVP Anti-Tamper**:
   - Attendees updating `/events/{eventId}` can only modify RSVP/attendance arrays (`attendees`, `attendeesCount`, `likes`, `comments`).
   - Event title, description, start time, end time, and host UID cannot be altered by attendees.
4. **Job Posting & Application Privacy**:
   - Only the posting employer or institutional admin can modify or delete an opportunity in `/opportunities/{id}`.
   - Job applications in `/job_applications/{id}` can only be read by the candidate applicant, the hiring employer, or system administrators.
5. **Direct Message & Conversation Isolation**:
   - Direct messages in `/conversations/{id}` and `/chats/{id}` can strictly be read and authored only by members registered in `participants` or `memberIds`.
6. **Immutable Audit Trails**:
   - `/audit_logs/{id}` and `/activity_logs/{id}` are strictly append-only. Neither users nor administrative interfaces can modify or delete historical audit entries.
7. **Webhook Authenticity & Anti-Replay**:
   - External webhooks require valid HMAC-SHA256 signatures derived from `WEBHOOK_SECRET`.
   - Webhook events outside the 5-minute replay window or presenting duplicate event IDs are rejected.

---

## 2. The Dirty Dozen Payloads (Security Penetration Test Suite)

| ID | Attack Vector | Target Endpoint / Path | Sample Malicious Payload | Expected Response |
|---|---|---|---|---|
| **P-01** | Privilege Escalation (Self-Admin) | `POST /api/auth/register` | `{"name":"Attacker","email":"att@sc.edu","password":"Pass123!","role":"admin"}` | **Role Forced to Alumni** |
| **P-02** | Unauthenticated Admin Access | `GET /api/admin/users` | `Authorization: none` | **401 Unauthorized** |
| **P-03** | Horizontal Privilege Escalation | `POST /api/admin/promote-user` | Token: `role: alumni`, Payload: `{"targetEmail":"att@sc.edu","newRole":"admin"}` | **403 Forbidden** |
| **P-04** | Email Spoofing via Unverified Token | `firestore.rules: isStaffOrAdmin()` | Token: `email: "sheepyawa@gmail.com", email_verified: false` | **Rules Deny (isStaffOrAdmin = false)** |
| **P-05** | Credential Exposure in User Record | Firestore: `setDoc(/users/test_uid)` | `{"uid":"test_uid","name":"Juan","password":"PlainPassword123"}` | **Rules Deny / Stripped by Sanitizer** |
| **P-06** | Student ID Injection / Malformed ID | `POST /api/admin/verify-student` | `{"studentId":"' OR 1=1; DROP TABLE students;--"}` | **400 Bad Request** |
| **P-07** | Tampered Webhook Payload | `POST /api/webhooks/alumni-events` | Valid signature for payload A, but sending payload B | **401 Unauthorized** |
| **P-08** | Webhook Replay Attack | `POST /api/webhooks/alumni-events` | Valid signature with duplicate `x-webhook-event-id` | **409 Conflict** |
| **P-09** | Stale Webhook Timestamp | `POST /api/webhooks/alumni-events` | Valid signature with `x-webhook-timestamp` > 5 min old | **400 Bad Request** |
| **P-10** | Malicious File Upload (Extension Spoofing) | `POST /api/upload/validate` | `{"fileName":"malicious.exe","size":1024,"mimeType":"application/octet-stream"}` | **400 Bad Request** |
| **P-11** | File Magic Bytes Mismatch | `POST /api/upload/validate` | `{"fileName":"avatar.jpg","headerHex":"89504E47"}` (PNG bytes with JPEG extension) | **400 Bad Request** |
| **P-12** | Cross-Site Scripting (XSS) in Chat Message | `POST /api/messages/validate` | `{"text":"Hello <script>alert(document.cookie)</script>"}` | **Sanitized: Script tags stripped** |

---

## 3. Server-Authoritative Controls Matrix

| Control Category | Implementation Location | Mechanism |
|---|---|---|
| **Row-Level Security** | `firestore.rules` | ABAC helpers (`isStaffOrAdmin`, `isOwner`, `isRegistrar`), email verification check |
| **Password Hashing** | `server.ts` | PBKDF2 with 100,000 iterations, SHA-512, 32-byte cryptographic salt |
| **Brute-Force Protection** | `server.ts` | Sliding window in-memory rate limiting for auth, upload, and verification |
| **Token Lifecycle** | `server.ts` | Expiration checking, single-use email verification, in-memory token revocation list |
| **Admin Route Protection** | `server.ts` | `requireServerAuth` and `requireRole(['admin'])` middleware enforcement |
| **Event / RSVP Anti-Tamper** | `firestore.rules` & `server.ts` | Disallow changes to event host/dates by attendees; validate RSVP identity |
| **Job Privacy** | `firestore.rules` | Applicant & employer isolated read/write rules on `/job_applications` |
| **Error Shielding** | `server.ts` | Universal 500 error handler suppressing internal stack traces and server paths |
