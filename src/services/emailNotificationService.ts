/**
 * St. Cecilia's College Alumni Network - Institutional Email Notification Service
 * Handles email dispatches and templating for Job Postings, Direct Messages, Events, Announcements, and Security Alerts.
 */

import { Opportunity, UserProfile, AlumniEvent, Announcement, EventReservation } from '../types';

export interface DispatchedEmail {
  id: string;
  toEmail: string;
  toName: string;
  subject: string;
  category: 'job' | 'message' | 'event' | 'announcement' | 'security' | 'system';
  previewText: string;
  htmlContent: string;
  sentAt: string;
  status: 'delivered' | 'simulated';
  metadata?: Record<string, any>;
}

const EMAIL_STORAGE_KEY = 'sc_alumni_dispatched_emails';

function createInitialDispatchedEmails(): DispatchedEmail[] {
  const now = new Date();
  const timeMinusMins = (mins: number) => new Date(now.getTime() - mins * 60 * 1000).toISOString();

  const welcomeHtml = wrapInInstitutionalEmailTemplate({
    title: 'Welcome to St. Cecilia’s College Alumni Network',
    recipientName: 'Valued Cecilian Alumnus',
    badgeText: 'Official Welcome Notice',
    badgeColor: '#8B181B',
    contentHtml: `
      <p>Congratulations and welcome to the official digital alumni network of <strong>St. Cecilia’s College - Cebu, Inc.</strong></p>
      <div class="card">
        <h3 style="margin: 0 0 6px 0; font-size: 15px; color: #1c1917;">Your Cecilian Alumni Membership is Active</h3>
        <p style="margin: 0 0 10px 0; font-size: 13px; color: #57534e;">
          Connect with over 12,000 graduates across computing, education, business, and maritime programs worldwide.
        </p>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #44403c; line-height: 1.6;">
          <li>Explore exclusive career vacancies from verified employer partners</li>
          <li>RSVP for campus reunions, seminars, and networking sessions</li>
          <li>Direct message fellow batchmates and academic mentors</li>
        </ul>
      </div>
      <p style="font-size: 13px; color: #57534e;">
        Keep your profile up-to-date to unlock personalized degree-relevant career alerts and registrar services.
      </p>
    `,
    actionText: 'Complete Your Alumni Profile',
    actionUrl: '#profile'
  });

  const jobHtml = wrapInInstitutionalEmailTemplate({
    title: 'New Career Opportunity Alert',
    recipientName: 'Valued Cecilian Graduate',
    badgeText: 'Job Opportunity Alert',
    badgeColor: '#1d4ed8',
    contentHtml: `
      <p>A new career opening matching St. Cecilia's College graduates has just been published by an accredited employer partner:</p>
      <div class="card">
        <h3 style="margin: 0 0 6px 0; font-size: 16px; color: #1c1917;">Software Engineer (Full-Stack TypeScript & React)</h3>
        <p style="margin: 0 0 10px 0; font-size: 13px; color: #78716c; font-weight: 500;">
          Accenture Technology Solutions • Cebu IT Park, Cebu City • Full-Time
        </p>
        <div style="display:inline-block; font-size:12px; font-weight:700; color:#15803d; background:#dcfce7; padding:2px 8px; border-radius:6px; margin-bottom:10px;">
          ₱45,000 - ₱70,000 / month
        </div>
        <p style="margin: 0; font-size: 13px; color: #44403c; line-height: 1.5;">
          Seeking enthusiastic BSIT / BSCS graduates with foundational skills in web development, database modeling, and modern JavaScript. Comprehensive onboarding and health benefits provided.
        </p>
      </div>
      <p style="font-size: 13px; color: #57534e;">
        As a verified graduate of St. Cecilia's College, your application receives prioritized employer attention.
      </p>
    `,
    actionText: 'View Job Details & Apply',
    actionUrl: '#opportunities'
  });

  const rsvpHtml = wrapInInstitutionalEmailTemplate({
    title: 'RSVP Confirmation',
    recipientName: 'Valued Cecilian Alumnus',
    badgeText: 'RSVP Confirmed',
    badgeColor: '#059669',
    contentHtml: `
      <p>We are delighted to confirm your registration for the upcoming Cecilian campus event:</p>
      <div class="card" style="border-left: 4px solid #10b981;">
        <h3 style="margin: 0 0 6px 0; font-size: 16px; color: #1c1917;">Grand Alumni Homecoming 2026: Rekindling Cecilian Excellence</h3>
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #78716c;">
          📅 <strong>Date & Time:</strong> Saturday, December 12, 2026 at 4:00 PM
        </p>
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #78716c;">
          📍 <strong>Location:</strong> Main Gymnasium, St. Cecilia's College Campus, Minglanilla, Cebu
        </p>
        <p style="margin: 0; font-size: 13px; color: #047857; font-weight: 600;">
          Status: Confirmed Attending
        </p>
      </div>
      <p style="font-size: 13px; color: #57534e;">
        You have also been connected to the official attendee discussion group chat in the Messaging center.
      </p>
    `,
    actionText: 'View Event Itinerary',
    actionUrl: '#events'
  });

  return [
    {
      id: `email_seed_welcome`,
      toEmail: 'alumni@stcecilia.edu',
      toName: 'Valued Cecilian Alumnus',
      subject: 'Welcome to St. Cecilia’s College Alumni Network',
      category: 'system',
      previewText: 'Your Cecilian Alumni Membership is active. Connect with graduates and discover opportunities.',
      htmlContent: welcomeHtml,
      sentAt: timeMinusMins(120),
      status: 'delivered'
    },
    {
      id: `email_seed_job`,
      toEmail: 'alumni@stcecilia.edu',
      toName: 'Valued Cecilian Graduate',
      subject: '💼 New Career Opportunity: Software Engineer at Accenture Technology Solutions',
      category: 'job',
      previewText: 'Accenture Technology Solutions is hiring for Software Engineer in Cebu IT Park.',
      htmlContent: jobHtml,
      sentAt: timeMinusMins(65),
      status: 'delivered',
      metadata: { company: 'Accenture Technology Solutions' }
    },
    {
      id: `email_seed_rsvp`,
      toEmail: 'alumni@stcecilia.edu',
      toName: 'Valued Cecilian Alumnus',
      subject: 'RSVP Confirmed: Grand Alumni Homecoming 2026 (Attending)',
      category: 'event',
      previewText: 'You are confirmed for "Grand Alumni Homecoming 2026" on Saturday, Dec 12, 2026.',
      htmlContent: rsvpHtml,
      sentAt: timeMinusMins(15),
      status: 'delivered',
      metadata: { eventId: 'event_homecoming_2026' }
    }
  ];
}

/**
 * Retrieve all logged dispatched emails from storage
 */
export function getDispatchedEmails(): DispatchedEmail[] {
  try {
    const raw = localStorage.getItem(EMAIL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // Seed initial dispatched emails if storage empty
    const initial = createInitialDispatchedEmails();
    localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(initial));
    return initial;
  } catch {
    return createInitialDispatchedEmails();
  }
}

/**
 * Save an email to the dispatched logs
 */
export function logDispatchedEmail(email: DispatchedEmail): void {
  try {
    const existing = getDispatchedEmails();
    const updated = [email, ...existing.filter((e) => e.id !== email.id)].slice(0, 100); // retain last 100 emails
    localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('sc_email_dispatched', { detail: email }));
  } catch (err) {
    console.warn('Could not persist dispatched email:', err);
  }
}

/**
 * Delete a specific dispatched email from log
 */
export function deleteDispatchedEmail(id: string): void {
  try {
    const existing = getDispatchedEmails();
    const updated = existing.filter((e) => e.id !== id);
    localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('sc_email_dispatched', { detail: { id, deleted: true } }));
  } catch {
    // ignore
  }
}

/**
 * Clear email dispatch history
 */
export function clearDispatchedEmails(): void {
  try {
    localStorage.removeItem(EMAIL_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('sc_email_dispatched', { detail: null }));
  } catch {
    // ignore
  }
}

/**
 * Send security alert email notification (e.g. Password Updated, Email Changed)
 */
export function sendSecurityAlertEmail(
  user: UserProfile,
  actionTitle: string,
  details: string
): DispatchedEmail | null {
  if (!user || !user.email) return null;

  const subject = `🔒 Security Notice: ${actionTitle} - St. Cecilia's College`;
  const previewText = details.slice(0, 120);

  const contentHtml = `
    <div class="card" style="border-left: 4px solid #b91c1c;">
      <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #1c1917;">Security Notice: ${actionTitle}</h3>
      <p style="margin: 0 0 12px 0; font-size: 13px; color: #44403c; line-height: 1.6;">
        ${details}
      </p>
      <div style="font-size: 12px; color: #78716c; background: #f5f5f4; padding: 10px 14px; border-radius: 8px;">
        <strong>Timestamp:</strong> ${new Date().toLocaleString('en-US')} • <strong>Session:</strong> Verified Web Client
      </div>
    </div>
    <p style="font-size: 13px; color: #57534e;">
      If you made this change, no additional action is required. If you did not authorize this change, please immediately notify <a href="mailto:security@stcecilia.edu" style="color:#8B181B; font-weight:600;">security@stcecilia.edu</a>.
    </p>
  `;

  const html = wrapInInstitutionalEmailTemplate({
    title: 'Account Security Notice',
    recipientName: user.name,
    badgeText: 'Security Notice',
    badgeColor: '#b91c1c',
    contentHtml,
    actionText: 'Manage Account Settings',
    actionUrl: '#settings'
  });

  const email: DispatchedEmail = {
    id: `email_sec_${Date.now()}`,
    toEmail: user.email,
    toName: user.name,
    subject,
    category: 'security',
    previewText,
    htmlContent: html,
    sentAt: new Date().toISOString(),
    status: 'delivered',
    metadata: { action: actionTitle }
  };

  logDispatchedEmail(email);
  return email;
}

/**
 * Base Institutional HTML email template generator
 */
function wrapInInstitutionalEmailTemplate(params: {
  title: string;
  recipientName: string;
  badgeText: string;
  badgeColor?: string;
  contentHtml: string;
  actionUrl?: string;
  actionText?: string;
}): string {
  const badgeBg = params.badgeColor || '#8B181B';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f6f4; margin: 0; padding: 24px 12px; color: #1c1917; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e7e5e4; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
    .header { background: #8B181B; padding: 28px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
    .header p { margin: 6px 0 0 0; font-size: 11px; opacity: 0.85; text-transform: uppercase; letter-spacing: 1px; }
    .content { padding: 32px 28px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; background-color: ${badgeBg}; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    .greeting { font-size: 16px; font-weight: 600; color: #292524; margin-bottom: 14px; }
    .body-text { font-size: 14px; line-height: 1.6; color: #44403c; margin-bottom: 20px; }
    .card { background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    .action-btn { display: inline-block; padding: 12px 28px; background-color: #8B181B; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 13px; text-align: center; }
    .footer { background: #fafaf9; border-top: 1px solid #f5f5f4; padding: 20px 24px; text-align: center; font-size: 11px; color: #78716c; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>St. Cecilia's College</h1>
      <p>Institutional Alumni & Career Portal</p>
    </div>
    <div class="content">
      <span class="badge">${params.badgeText}</span>
      <div class="greeting">Dear ${params.recipientName},</div>
      <div class="body-text">${params.contentHtml}</div>
      ${
        params.actionText
          ? `<div style="text-align: center; margin-top: 28px;">
              <a href="${params.actionUrl || '#'}" class="action-btn">${params.actionText}</a>
            </div>`
          : ''
      }
    </div>
    <div class="footer">
      <p>This is an automated notification from St. Cecilia's College Alumni Network.</p>
      <p>Poblacion Ward II, Minglanilla, Cebu, Philippines • <a href="#" style="color:#8B181B; text-decoration:none;">Manage Notification Preferences</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send email notification for a newly published Job Opportunity
 */
export function sendJobPostingEmail(
  job: Opportunity,
  targetAlumni: UserProfile[]
): { dispatchedCount: number } {
  if (!targetAlumni || targetAlumni.length === 0) return { dispatchedCount: 0 };

  let count = 0;
  targetAlumni.forEach((alumnus) => {
    // Check if user has email preferences enabled
    const emailPref = alumnus.settings?.notificationsEmail ?? true;
    if (!emailPref || !alumnus.email) return;

    const subject = `💼 New Career Opportunity: ${job.title} at ${job.company}`;
    const previewText = `${job.company} is hiring for ${job.title} (${job.location}). Discover requirements and apply directly.`;

    const contentHtml = `
      <p>A new career opening matching your Cecilian alumni profile has just been published on the Institutional Portal:</p>
      <div class="card">
        <h3 style="margin: 0 0 6px 0; font-size: 16px; color: #1c1917;">${job.title}</h3>
        <p style="margin: 0 0 10px 0; font-size: 13px; color: #78716c; font-weight: 500;">
          ${job.company} • ${job.location} • ${job.type}
        </p>
        ${
          (job.salaryOrStipend || (job as any).salary)
            ? `<div style="display:inline-block; font-size:12px; font-weight:700; color:#15803d; background:#dcfce7; padding:2px 8px; border-radius:6px; margin-bottom:10px;">${job.salaryOrStipend || (job as any).salary}</div>`
            : ''
        }
        <p style="margin: 0; font-size: 13px; color: #44403c; line-height: 1.5;">
          ${job.description.slice(0, 180)}...
        </p>
      </div>
      <p style="font-size: 13px; color: #57534e;">
        As a verified graduate of St. Cecilia's College, your application receives prioritized employer attention.
      </p>
    `;

    const html = wrapInInstitutionalEmailTemplate({
      title: 'New Career Opportunity',
      recipientName: alumnus.name,
      badgeText: 'Career Opportunity Alert',
      badgeColor: '#1d4ed8',
      contentHtml,
      actionText: 'View Job Details & Apply',
      actionUrl: '#opportunities'
    });

    const email: DispatchedEmail = {
      id: `email_job_${Date.now()}_${count}`,
      toEmail: alumnus.email,
      toName: alumnus.name,
      subject,
      category: 'job',
      previewText,
      htmlContent: html,
      sentAt: new Date().toISOString(),
      status: 'delivered',
      metadata: { jobId: job.id, company: job.company }
    };

    logDispatchedEmail(email);
    count++;
  });

  return { dispatchedCount: count };
}

/**
 * Send email notification for an incoming Direct Message
 */
export function sendDirectMessageEmail(
  sender: UserProfile,
  recipient: UserProfile,
  messageSnippet: string,
  chatId: string
): DispatchedEmail | null {
  const messagesPref = recipient.settings?.notificationsMessages ?? true;
  if (!messagesPref || !recipient.email) return null;

  const subject = `💬 New Message from ${sender.name} on Cecilian Alumni Network`;
  const previewText = `${sender.name}: "${messageSnippet.slice(0, 80)}"`;

  const contentHtml = `
    <p>You have received a new private message from <strong>${sender.name || 'A Fellow Cecilian'}</strong> (${sender.role === 'alumni' ? `Class of ${sender.batch || 'Alumni'}` : (sender.role || 'Member').toUpperCase()}):</p>
    <div class="card" style="border-left: 4px solid #8B181B;">
      <p style="margin: 0; font-style: italic; font-size: 14px; color: #292524;">
        "${messageSnippet.slice(0, 260)}${messageSnippet.length > 260 ? '...' : ''}"
      </p>
      <div style="margin-top: 10px; font-size: 11px; color: #78716c;">
        Sent via St. Cecilia's Instant Direct Messaging
      </div>
    </div>
    <p style="font-size: 13px; color: #57534e;">
      Reply promptly to maintain active networking connections with your fellow Cecilians.
    </p>
  `;

  const html = wrapInInstitutionalEmailTemplate({
    title: 'New Message Notification',
    recipientName: recipient.name,
    badgeText: 'Direct Message Notification',
    badgeColor: '#7c3aed',
    contentHtml,
    actionText: 'Open Message & Reply',
    actionUrl: '#messages'
  });

  const email: DispatchedEmail = {
    id: `email_msg_${Date.now()}`,
    toEmail: recipient.email,
    toName: recipient.name,
    subject,
    category: 'message',
    previewText,
    htmlContent: html,
    sentAt: new Date().toISOString(),
    status: 'delivered',
    metadata: { senderId: sender.uid, chatId }
  };

  logDispatchedEmail(email);
  return email;
}

/**
 * Send email notification for Event RSVP confirmation or cancellation
 */
export function sendEventRsvpEmail(
  event: AlumniEvent,
  attendee: UserProfile,
  status: 'going' | 'interested' | 'cancelled'
): DispatchedEmail | null {
  const eventsPref = attendee.settings?.notificationsEvents ?? true;
  if (!eventsPref || !attendee.email) return null;

  const isCancelled = status === 'cancelled';
  const subject = isCancelled
    ? `RSVP Cancelled: ${event.title}`
    : `RSVP Confirmed: ${event.title} (${status === 'going' ? 'Attending' : 'Interested'})`;

  const eventDateFormatted = new Date(event.startDate).toLocaleString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  const previewText = isCancelled
    ? `Your RSVP for "${event.title}" has been successfully cancelled.`
    : `You are confirmed for "${event.title}" on ${eventDateFormatted}.`;

  const contentHtml = isCancelled
    ? `
      <p>Your RSVP cancellation for the following event has been recorded:</p>
      <div class="card" style="border-left: 4px solid #ef4444;">
        <h3 style="margin: 0 0 6px 0; font-size: 16px; color: #1c1917;">${event.title}</h3>
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #78716c;">
          📅 <strong>Date:</strong> ${eventDateFormatted}
        </p>
        <p style="margin: 0; font-size: 13px; color: #78716c;">
          📍 <strong>Venue:</strong> ${event.location}
        </p>
      </div>
      <p style="font-size: 13px; color: #57534e;">
        Your reservation has been released and your spot made available to other alumni. If your schedule changes, you may RSVP again anytime before registration closes.
      </p>
    `
    : `
      <p>We are delighted to confirm your registration for the upcoming Cecilian event:</p>
      <div class="card" style="border-left: 4px solid #10b981;">
        <h3 style="margin: 0 0 6px 0; font-size: 16px; color: #1c1917;">${event.title}</h3>
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #78716c;">
          📅 <strong>Date & Time:</strong> ${eventDateFormatted}
        </p>
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #78716c;">
          📍 <strong>Location:</strong> ${event.location} ${event.isVirtual ? '(Virtual Event)' : ''}
        </p>
        <p style="margin: 0; font-size: 13px; color: #047857; font-weight: 600;">
          Status: Confirmed ${status === 'going' ? 'Attending' : 'Interested'}
        </p>
      </div>
      <p style="font-size: 13px; color: #57534e;">
        You have also been connected to the official attendee discussion group chat in the Messaging center.
      </p>
    `;

  const html = wrapInInstitutionalEmailTemplate({
    title: isCancelled ? 'RSVP Cancellation Notice' : 'RSVP Confirmation',
    recipientName: attendee.name,
    badgeText: isCancelled ? 'RSVP Cancelled' : 'RSVP Confirmed',
    badgeColor: isCancelled ? '#dc2626' : '#059669',
    contentHtml,
    actionText: 'View Event Details',
    actionUrl: '#events'
  });

  const email: DispatchedEmail = {
    id: `email_event_rsvp_${Date.now()}`,
    toEmail: attendee.email,
    toName: attendee.name,
    subject,
    category: 'event',
    previewText,
    htmlContent: html,
    sentAt: new Date().toISOString(),
    status: 'delivered',
    metadata: { eventId: event.id, status }
  };

  logDispatchedEmail(email);
  return email;
}

/**
 * Send automated 24-hour reminder email notification for an upcoming reserved event
 * Engineered to maximize attendance rate with direct pass access and RSVP re-confirmation.
 */
export function sendEvent24HourReminderEmail(
  event: AlumniEvent,
  attendee: UserProfile,
  reservation?: EventReservation
): DispatchedEmail | null {
  const eventsPref = attendee.settings?.notificationsEvents ?? true;
  if (!eventsPref || !attendee.email) return null;

  const eventDateFormatted = new Date(event.startDate).toLocaleString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  const reservationCode = reservation?.id || 'SCC-RSVP';
  const seatsCount = reservation?.totalSeats || 1;
  const venueName = event.venue || event.location || 'St. Cecilia’s College Campus';

  const subject = `🚨 Reminder: "${event.title}" is Tomorrow (${eventDateFormatted}) - Reserved Seat Notice`;
  const previewText = `Your reserved seat pass #${reservationCode} is confirmed for tomorrow. Tap to view your digital pass and verify attendance.`;

  const contentHtml = `
    <p>This is an automated 24-hour attendance alert from the Office of Alumni Relations. Your seat reservation is confirmed for tomorrow:</p>
    <div class="card" style="border-left: 4px solid #8B181B; background: #fafaf9;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-family: monospace; font-size: 13px; font-weight: 700; color: #8B181B; background: #fee2e2; padding: 2px 8px; border-radius: 4px;">
          Pass #${reservationCode}
        </span>
        <span style="font-size: 12px; font-weight: 600; color: #047857; background: #d1fae5; padding: 2px 8px; border-radius: 4px;">
          ${seatsCount} Reserved Seat${seatsCount > 1 ? 's' : ''} Confirmed
        </span>
      </div>
      <h3 style="margin: 0 0 6px 0; font-size: 16px; color: #1c1917; font-weight: 700;">${event.title}</h3>
      <p style="margin: 0 0 4px 0; font-size: 13px; color: #57534e;">
        📅 <strong>Date & Time:</strong> ${eventDateFormatted}
      </p>
      <p style="margin: 0 0 4px 0; font-size: 13px; color: #57534e;">
        📍 <strong>Venue / Location:</strong> ${venueName} ${event.isVirtual ? '(Virtual Stream Available)' : ''}
      </p>
      <p style="margin: 0; font-size: 13px; color: #57534e;">
        🎓 <strong>Attendee:</strong> ${attendee.name} (${attendee.batch ? 'Batch ' + attendee.batch : 'Alumnus'})
      </p>
    </div>
    
    <div style="margin: 16px 0; padding: 12px 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
      <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #991b1b;">
        ⚡ Attendance Confirmation & Rapid Check-in Policy:
      </p>
      <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #7f1d1d; line-height: 1.5;">
        <li>Please present your official SCC Digital QR Pass or Reservation ID upon entry at the campus gate.</li>
        <li>Doors open 30 minutes prior to official convocation time.</li>
        <li>If you can no longer attend, please release your seat in the portal so waitlisted alumni may take your place.</li>
      </ul>
    </div>
  `;

  const html = wrapInInstitutionalEmailTemplate({
    title: '24-Hour Event Reservation Reminder',
    recipientName: attendee.name,
    badgeText: '24-Hour Countdown Alert',
    badgeColor: '#8B181B',
    contentHtml,
    actionText: 'View Digital Pass & Confirm Attendance',
    actionUrl: '#dashboard'
  });

  const email: DispatchedEmail = {
    id: `email_event_24h_${reservationCode}_${Date.now()}`,
    toEmail: attendee.email,
    toName: attendee.name,
    subject,
    category: 'event',
    previewText,
    htmlContent: html,
    sentAt: new Date().toISOString(),
    status: 'delivered',
    metadata: { eventId: event.id, reservationId: reservationCode, type: '24h_reminder' }
  };

  logDispatchedEmail(email);
  return email;
}

/**
 * Send email notification for an Institutional Announcement
 */
export function sendAnnouncementEmail(
  announcement: Announcement,
  targetAlumni: UserProfile[]
): { dispatchedCount: number } {
  if (!targetAlumni || targetAlumni.length === 0) return { dispatchedCount: 0 };

  let count = 0;
  targetAlumni.forEach((alumnus) => {
    const emailPref = alumnus.settings?.notificationsEmail ?? true;
    if (!emailPref || !alumnus.email) return;

    const subject = `📢 ${announcement.important ? 'Important: ' : ''}${announcement.title}`;
    const previewText = announcement.content.slice(0, 100);

    const contentHtml = `
      <div class="card" style="border-left: 4px solid ${announcement.important ? '#b91c1c' : '#8B181B'};">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #1c1917;">${announcement.title}</h3>
        <p style="margin: 0; font-size: 13px; color: #44403c; line-height: 1.6; white-space: pre-line;">
          ${announcement.content}
        </p>
      </div>
    `;

    const html = wrapInInstitutionalEmailTemplate({
      title: 'Institutional Announcement',
      recipientName: alumnus.name,
      badgeText: announcement.important ? 'High-Priority Announcement' : 'University Broadcast',
      badgeColor: announcement.important ? '#b91c1c' : '#8B181B',
      contentHtml,
      actionText: 'View on Institutional Portal',
      actionUrl: '#announcements'
    });

    const email: DispatchedEmail = {
      id: `email_ann_${Date.now()}_${count}`,
      toEmail: alumnus.email,
      toName: alumnus.name,
      subject,
      category: 'announcement',
      previewText,
      htmlContent: html,
      sentAt: new Date().toISOString(),
      status: 'delivered',
      metadata: { announcementId: announcement.id }
    };

    logDispatchedEmail(email);
    count++;
  });

  return { dispatchedCount: count };
}
