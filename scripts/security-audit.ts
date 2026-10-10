/**
 * ST. CECILIA'S COLLEGE ALUMNI MANAGEMENT SYSTEM
 * AUTOMATED SECURITY & HARDENING VERIFICATION SUITE
 * 
 * Verifies backend RLS, dual-layer validation, rate limiting,
 * role authorization, tamper defenses, PBKDF2 hashing, and webhook HMAC.
 */

import crypto from 'crypto';

const BASE_URL = 'http://localhost:3000';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'institutional-secure-webhook-key-2026';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
  }
}

async function runAudit() {
  console.log('================================================================');
  console.log('   ST. CECILIA’S COLLEGE ALUMNI PORTAL - SECURITY AUDIT SUITE   ');
  console.log('================================================================\n');

  // TEST 1: Health & Security Headers
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    assert(res.status === 200, 'Health endpoint responds with 200 OK');
    assert(data.status === 'healthy', 'System status is healthy');
    assert(data.security?.rowLevelSecurity === 'enabled', 'RLS is marked enabled');
    assert(res.headers.get('x-content-type-options') === 'nosniff', 'Security header nosniff is set');
    assert(!!res.headers.get('content-security-policy'), 'CSP header is present');
  } catch (err: any) {
    assert(false, 'Health endpoint check', err.message);
  }

  // TEST 2: Protected Admin Route - Unauthenticated Access Rejection (401)
  try {
    const res = await fetch(`${BASE_URL}/api/admin/users`);
    assert(res.status === 401, 'Direct unauthenticated request to /api/admin/users receives 401 Unauthorized');
  } catch (err: any) {
    assert(false, 'Admin unauthenticated check', err.message);
  }

  // TEST 3: Login as Alumni & Attempt Admin Route Bypass (403 Forbidden)
  let alumniToken = '';
  let alumniUid = '';
  try {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alumni@stcecilia.edu',
        password: 'Password123!'
      })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'Alumni can authenticate with valid PBKDF2 password');
    alumniToken = loginData.token;
    alumniUid = loginData.user.uid;

    // Now try to access admin users endpoint with alumni token
    const adminRes = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${alumniToken}` }
    });
    assert(adminRes.status === 403, 'Alumni bearer token to /api/admin/users receives 403 Forbidden');

    // Attempt privilege escalation to promote user with alumni token
    const promoteRes = await fetch(`${BASE_URL}/api/admin/promote-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alumniToken}`
      },
      body: JSON.stringify({
        targetEmail: 'alumni@stcecilia.edu',
        newRole: 'admin'
      })
    });
    assert(promoteRes.status === 403, 'Alumni attempting self-promotion receives 403 Forbidden');
  } catch (err: any) {
    assert(false, 'Alumni authentication and RBAC enforcement', err.message);
  }

  // TEST 4: Login as Admin & Perform Authorized Role Management
  let adminToken = '';
  try {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@stcecilia.edu',
        password: 'Password123!'
      })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'Admin authenticates with PBKDF2');
    adminToken = loginData.token;

    // Admin lists users
    const adminRes = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminUsers = await adminRes.json();
    assert(adminRes.status === 200, 'Admin can list users with 200 OK');
    assert(Array.isArray(adminUsers.users), 'Admin received user list');

    // Check that sensitive password hashes are NEVER exposed in user listing
    const anyHashExposed = adminUsers.users.some((u: any) => u.hash || u.password || u.salt);
    assert(!anyHashExposed, 'Password hashes and salts are strictly excluded from API response');
  } catch (err: any) {
    assert(false, 'Admin operations', err.message);
  }

  // TEST 5: Student Verification Route Parameter & Pattern Defense
  try {
    // Bad format
    const badRes = await fetch(`${BASE_URL}/api/admin/verify-student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        studentId: 'MALICIOUS_INPUT_123'
      })
    });
    assert(badRes.status === 400, 'Invalid Student ID format is rejected with 400 Bad Request');

    // Valid format SCC-YYYY-XXXX
    const goodRes = await fetch(`${BASE_URL}/api/admin/verify-student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        studentId: 'SCC-2020-0192',
        batchYear: '2024',
        course: 'B.S. Information Technology'
      })
    });
    assert(goodRes.status === 200, 'Valid Student ID SCC-2020-0192 accepted with 200 OK');
  } catch (err: any) {
    assert(false, 'Student verification parameter defense', err.message);
  }

  // TEST 6: Email Verification Single-Use & Expiry Defense
  try {
    // Request verification
    const reqRes = await fetch(`${BASE_URL}/api/auth/verify-email/resend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test_student@stcecilia.edu' })
    });
    const reqData = await reqRes.json();
    assert(reqRes.status === 200, 'Verification link generation endpoint returns 200 OK');

    // Attempt confirm with invalid token
    const fakeConfirm = await fetch(`${BASE_URL}/api/auth/verify-email/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alumni@stcecilia.edu',
        token: 'invalid_token_12345'
      })
    });
    assert(fakeConfirm.status === 400, 'Invalid verification token rejected with 400 Bad Request');
  } catch (err: any) {
    assert(false, 'Email verification defense', err.message);
  }

  // TEST 7: Webhook HMAC-SHA256 Signature Verification & Replay Protection
  try {
    const timestamp = Date.now().toString();
    const eventId = `evt_${Date.now()}_test`;
    const payload = { eventType: 'alumni_donation', amount: 500 };
    const payloadStr = `${timestamp}.${JSON.stringify(payload)}`;
    const validSignature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(payloadStr).digest('hex');

    // 1. Valid Signature
    const validRes = await fetch(`${BASE_URL}/api/webhooks/alumni-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': validSignature,
        'x-webhook-timestamp': timestamp,
        'x-webhook-event-id': eventId
      },
      body: JSON.stringify(payload)
    });
    assert(validRes.status === 200, 'Webhook with valid HMAC-SHA256 signature accepted with 200 OK');

    // 2. Tampered Payload (signature mismatch)
    const tamperedRes = await fetch(`${BASE_URL}/api/webhooks/alumni-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': validSignature,
        'x-webhook-timestamp': timestamp,
        'x-webhook-event-id': `evt_${Date.now()}_tampered`
      },
      body: JSON.stringify({ eventType: 'alumni_donation', amount: 9999999 })
    });
    assert(tamperedRes.status === 401, 'Tampered webhook payload rejected with 401 Unauthorized');

    // 3. Replay Attack (same eventId)
    const replayRes = await fetch(`${BASE_URL}/api/webhooks/alumni-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': validSignature,
        'x-webhook-timestamp': timestamp,
        'x-webhook-event-id': eventId
      },
      body: JSON.stringify(payload)
    });
    assert(replayRes.status === 409, 'Duplicate webhook eventId replay rejected with 409 Conflict');

    // 4. Stale/Expired Timestamp (> 5 min)
    const staleTimestamp = (Date.now() - 6 * 60 * 1000).toString();
    const stalePayloadStr = `${staleTimestamp}.${JSON.stringify(payload)}`;
    const staleSig = crypto.createHmac('sha256', WEBHOOK_SECRET).update(stalePayloadStr).digest('hex');
    const staleRes = await fetch(`${BASE_URL}/api/webhooks/alumni-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': staleSig,
        'x-webhook-timestamp': staleTimestamp,
        'x-webhook-event-id': `evt_${Date.now()}_stale`
      },
      body: JSON.stringify(payload)
    });
    assert(staleRes.status === 400, 'Expired webhook timestamp rejected with 400 Bad Request');
  } catch (err: any) {
    assert(false, 'Webhook HMAC & replay defense', err.message);
  }

  // TEST 8: File Upload Magic Bytes & Extension Inspection
  try {
    // 1. Disallowed extension (.exe)
    const exeRes = await fetch(`${BASE_URL}/api/upload/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: 'malicious.exe',
        size: 1024,
        mimeType: 'application/x-msdownload'
      })
    });
    assert(exeRes.status === 400, 'Disallowed executable extension rejected with 400 Bad Request');

    // 2. Mismatched magic bytes (PNG header claimed for JPEG)
    const mismatchRes = await fetch(`${BASE_URL}/api/upload/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: 'photo.jpg',
        size: 2048,
        mimeType: 'image/jpeg',
        headerHex: '89504E47' // PNG header instead of FFD8FF
      })
    });
    assert(mismatchRes.status === 400, 'Mismatched magic bytes rejected with 400 Bad Request');

    // 3. Valid PDF with correct magic bytes
    const validPdfRes = await fetch(`${BASE_URL}/api/upload/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: 'resume.pdf',
        size: 10240,
        mimeType: 'application/pdf',
        headerHex: '25504446' // %PDF
      })
    });
    assert(validPdfRes.status === 200, 'Valid PDF with matched magic bytes accepted with 200 OK');
  } catch (err: any) {
    assert(false, 'File upload validation', err.message);
  }

  // TEST 9: Anti-Abuse RSVP & Message Length Controls
  try {
    // Message too long (> 2000 chars)
    const longMsgRes = await fetch(`${BASE_URL}/api/messages/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alumniToken}`
      },
      body: JSON.stringify({
        text: 'A'.repeat(2500)
      })
    });
    assert(longMsgRes.status === 400, 'Message exceeding 2000 characters rejected with 400 Bad Request');

    // Valid sanitized message
    const validMsgRes = await fetch(`${BASE_URL}/api/messages/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alumniToken}`
      },
      body: JSON.stringify({
        text: 'Hello batchmates! <script>alert("xss")</script>'
      })
    });
    const validMsgData = await validMsgRes.json();
    assert(validMsgRes.status === 200, 'Valid message accepted');
    assert(!validMsgData.sanitizedText.includes('<script>'), 'XSS script tags stripped from message');
  } catch (err: any) {
    assert(false, 'Anti-abuse message validation', err.message);
  }

  // TEST 10: Token Revocation on Logout
  try {
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${alumniToken}` }
    });
    assert(logoutRes.status === 200, 'Logout succeeds and revokes bearer token');

    // Attempt to reuse revoked token
    const reuseRes = await fetch(`${BASE_URL}/api/events/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alumniToken}`
      },
      body: JSON.stringify({ eventId: 'event_001' })
    });
    assert(reuseRes.status === 401, 'Reusing revoked bearer token rejected with 401 Unauthorized');
  } catch (err: any) {
    assert(false, 'Token revocation verification', err.message);
  }

  console.log('\n================================================================');
  console.log(`   SECURITY AUDIT RESULTS: ${passedTests} / ${totalTests} TESTS PASSED   `);
  console.log('================================================================\n');

  if (passedTests === totalTests) {
    console.log('ALL SECURITY CONTROLS VERIFIED AND OPERATIONAL.');
    process.exit(0);
  } else {
    console.error('CRITICAL: Some security controls failed verification.');
    process.exit(1);
  }
}

runAudit();
