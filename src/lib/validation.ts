/**
 * Institutional Form Input Validation Suite
 * Dual-layer validation for frontend forms and backend server-side endpoints.
 */

export interface ValidationOutput {
  isValid: boolean;
  error?: string;
  sanitizedValue?: string;
}

// 1. Full Name Validation
export function validateName(name: unknown): ValidationOutput {
  if (typeof name !== 'string') {
    return { isValid: false, error: 'Name must be a string.' };
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters long.' };
  }
  if (trimmed.length > 100) {
    return { isValid: false, error: 'Name cannot exceed 100 characters.' };
  }
  // Allow letters, spaces, hyphens, apostrophes, and periods (e.g. Jr., Maria-Elena O'Connor)
  const nameRegex = /^[a-zA-Z\u00C0-\u024F\s\.\'\-]+$/;
  if (!nameRegex.test(trimmed)) {
    return { isValid: false, error: 'Name contains invalid characters.' };
  }
  return { isValid: true, sanitizedValue: trimmed };
}

// 2. Email Address Validation
export function validateEmail(email: unknown): ValidationOutput {
  if (typeof email !== 'string') {
    return { isValid: false, error: 'Email must be a valid string.' };
  }
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    return { isValid: false, error: 'Email address is required.' };
  }
  if (trimmed.length > 120) {
    return { isValid: false, error: 'Email cannot exceed 120 characters.' };
  }
  // RFC 5322 compatible regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }
  return { isValid: true, sanitizedValue: trimmed };
}

// 3. School ID Validation
export function validateSchoolId(schoolId: unknown): ValidationOutput {
  if (typeof schoolId !== 'string') {
    return { isValid: false, error: 'School ID must be a string.' };
  }
  const trimmed = schoolId.trim().toUpperCase();
  if (!trimmed) {
    return { isValid: false, error: 'Student/School ID is required.' };
  }
  if (trimmed.length < 3 || trimmed.length > 30) {
    return { isValid: false, error: 'School ID must be between 3 and 30 characters.' };
  }
  // Alphanumeric with optional single hyphens, slashes, or underscores
  const idRegex = /^[A-Z0-9]+([_\-\/\.][A-Z0-9]+)*$/;
  if (!idRegex.test(trimmed)) {
    return { isValid: false, error: 'School ID format is invalid (allowed: letters, digits, hyphen, slash).' };
  }
  return { isValid: true, sanitizedValue: trimmed };
}

// 4. Phone Number Validation
export function validatePhoneNumber(phone: unknown): ValidationOutput {
  if (!phone || typeof phone !== 'string') {
    return { isValid: true, sanitizedValue: '' }; // Optional
  }
  const trimmed = phone.trim();
  if (!trimmed) {
    return { isValid: true, sanitizedValue: '' };
  }
  // International format: +1234567890 or 09171234567
  const phoneRegex = /^\+?[0-9\s\-\(\)\.]{7,25}$/;
  if (!phoneRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid phone number format.' };
  }
  return { isValid: true, sanitizedValue: trimmed };
}

// 5. Password Strength Validation
export function validatePassword(password: unknown): ValidationOutput {
  if (typeof password !== 'string') {
    return { isValid: false, error: 'Password is required.' };
  }
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long.' };
  }
  if (password.length > 128) {
    return { isValid: false, error: 'Password cannot exceed 128 characters.' };
  }
  // Require at least one letter and at least one number
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  if (!hasLetter || !hasDigit) {
    return { isValid: false, error: 'Password must contain at least one letter and one number.' };
  }
  return { isValid: true };
}

// 6. Job Posting Validation
export function validateJobPayload(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Invalid job payload.'] };
  }

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 3) {
    errors.push('Job title must be at least 3 characters.');
  }
  if (!data.company || typeof data.company !== 'string' || data.company.trim().length < 2) {
    errors.push('Company name is required.');
  }
  if (!data.location || typeof data.location !== 'string') {
    errors.push('Location is required.');
  }
  if (!data.description || typeof data.description !== 'string' || data.description.trim().length < 10) {
    errors.push('Job description must be at least 10 characters.');
  }
  if (data.applicationUrl && typeof data.applicationUrl === 'string' && data.applicationUrl.trim()) {
    try {
      new URL(data.applicationUrl.trim());
    } catch {
      errors.push('Application URL must be a valid web link.');
    }
  }

  return { isValid: errors.length === 0, errors };
}

// 7. Event Creation Validation
export function validateEventPayload(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Invalid event payload.'] };
  }

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 3) {
    errors.push('Event title must be at least 3 characters.');
  }
  if (!data.description || typeof data.description !== 'string' || data.description.trim().length < 10) {
    errors.push('Event description must be at least 10 characters.');
  }
  if (!data.startDate || isNaN(Date.parse(data.startDate))) {
    errors.push('Valid start date and time is required.');
  }
  if (data.endDate && isNaN(Date.parse(data.endDate))) {
    errors.push('End date format is invalid.');
  }
  if (data.startDate && data.endDate && new Date(data.endDate).getTime() < new Date(data.startDate).getTime()) {
    errors.push('Event end time cannot be earlier than start time.');
  }
  if (typeof data.maxAttendees === 'number' && (data.maxAttendees < 1 || data.maxAttendees > 100000)) {
    errors.push('Max attendees must be between 1 and 100,000.');
  }

  return { isValid: errors.length === 0, errors };
}

// 8. Chat Message Validation
export function validateChatMessage(text: unknown): ValidationOutput {
  if (typeof text !== 'string') {
    return { isValid: false, error: 'Message text must be a string.' };
  }
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Message cannot be empty.' };
  }
  if (trimmed.length > 2000) {
    return { isValid: false, error: 'Message exceeds maximum length of 2,000 characters.' };
  }
  return { isValid: true, sanitizedValue: trimmed };
}

// 9. Search / Filter Parameters Validation
export function sanitizeSearchQuery(query: unknown): string {
  if (typeof query !== 'string') return '';
  // Prevent regex injection or denial-of-service in client/server searches
  const sanitized = query.slice(0, 100).replace(/[<>{}[\]\\]/g, '');
  return sanitized.trim();
}
