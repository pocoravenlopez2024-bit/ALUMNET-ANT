import {
  UserProfile,
  AlumniEvent,
  Announcement,
  Opportunity,
  JobMatchResult,
  DuplicateRecordFlag,
  IncompleteRecordFlag,
  AlumniReportSummary,
  CareerSurveyResponse
} from '../types';

export interface PersonalizedAnnouncement extends Announcement {
  isPersonalized: boolean;
  matchReasons: string[];
  relevanceScore: number;
}

/**
 * Filter and score announcements based on user's graduation batch, department, and course profile.
 */
export function filterAnnouncementsForUser(
  announcements: Announcement[],
  user?: UserProfile | null
): PersonalizedAnnouncement[] {
  if (!announcements || announcements.length === 0) return [];

  return announcements
    .map((ann) => {
      const matchReasons: string[] = [];
      let score = 0;

      // Urgent or critical institutional announcements get base high priority
      if (ann.urgent) {
        matchReasons.push('Urgent Institutional Broadcast');
        score += 50;
      }
      if (ann.important) {
        matchReasons.push('Featured Announcement');
        score += 25;
      }

      if (user) {
        // Match Graduation Batch / Year
        if (user.batch && ann.targetBatches && ann.targetBatches.length > 0) {
          const batchMatch = ann.targetBatches.includes(user.batch);
          if (batchMatch) {
            matchReasons.push(`Class of ${user.batch} Specific`);
            score += 40;
          }
        }

        // Match Department or Course
        const userDeptOrCourse = `${user.department || ''} ${user.course || ''}`.toLowerCase();
        if (ann.targetDepartments && ann.targetDepartments.length > 0) {
          const deptMatch = ann.targetDepartments.some((targetDept) => {
            const lowerTarget = targetDept.toLowerCase();
            return (
              userDeptOrCourse.includes(lowerTarget) ||
              (lowerTarget.includes('tech') && (userDeptOrCourse.includes('information tech') || userDeptOrCourse.includes('computer science'))) ||
              (lowerTarget.includes('nursing') && userDeptOrCourse.includes('nursing')) ||
              (lowerTarget.includes('education') && userDeptOrCourse.includes('education')) ||
              (lowerTarget.includes('business') && (userDeptOrCourse.includes('business') || userDeptOrCourse.includes('accountancy')))
            );
          });

          if (deptMatch) {
            matchReasons.push(`Targeted to your Academic Program`);
            score += 35;
          }
        }
      }

      // Recent announcements get recency boost
      const pubDate = new Date(ann.publishedAt || Date.now()).getTime();
      const validPubDate = isNaN(pubDate) ? Date.now() : pubDate;
      const daysSince = Math.max(0, (Date.now() - validPubDate) / (1000 * 60 * 60 * 24));
      score += Math.max(0, 15 - daysSince);

      const isPersonalized = matchReasons.length > 0;

      return {
        ...ann,
        isPersonalized,
        matchReasons,
        relevanceScore: score
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Automatically inspects user profile completeness and detects missing fields.
 */
export function calculateProfileCompletion(user: UserProfile): {
  percentage: number;
  missingFields: string[];
  isComplete: boolean;
} {
  const fields = [
    { key: 'currentPosition', label: 'Current Job Position', value: user.currentPosition },
    { key: 'company', label: 'Company / Organization', value: user.company },
    { key: 'location', label: 'Residence / City', value: user.location },
    { key: 'phone', label: 'Contact Phone Number', value: user.phone },
    { key: 'skills', label: 'Skills & Proficiencies', value: user.skills && user.skills.length > 0 },
    { key: 'headline', label: 'Professional Headline', value: user.headline },
    { key: 'about', label: 'Bio / About Me', value: user.about || user.bio },
    { key: 'employmentStatus', label: 'Employment Status', value: user.employmentStatus }
  ];

  const missingFields: string[] = [];
  let filledCount = 0;

  for (const field of fields) {
    if (field.value) {
      filledCount++;
    } else {
      missingFields.push(field.label);
    }
  }

  const percentage = Math.round((filledCount / fields.length) * 100);

  return {
    percentage,
    missingFields,
    isComplete: percentage >= 80
  };
}

/**
 * Calculates dynamic engagement score (0-100) for an alumnus.
 */
export function calculateEngagementScore(user: UserProfile, events: AlumniEvent[]): number {
  let score = 0;

  // Profile completion contribution (up to 25 pts)
  const completion = calculateProfileCompletion(user);
  score += Math.round((completion.percentage / 100) * 25);

  // Verification contribution (20 pts)
  if (user.isVerified) score += 20;

  // Event attendance (up to 25 pts)
  const attendedEvents = events.filter((e) =>
    e.attendees?.some((a) => a.uid === user.uid && a.status === 'going')
  );
  score += Math.min(25, attendedEvents.length * 8);

  // Network activity (up to 15 pts)
  const connections = (user.connectionsCount || 0) + (user.followingCount || 0);
  score += Math.min(15, connections * 3);

  // Work experience/education logged (up to 15 pts)
  const expCount = (user.experience?.length || 0) + (user.education?.length || 0);
  score += Math.min(15, expCount * 5);

  return Math.min(100, Math.max(10, score));
}

/**
 * Automatic Job Matching algorithm comparing opportunity requirements with user profile.
 */
export function calculateJobMatch(opportunity: Opportunity, user: UserProfile): JobMatchResult {
  let matchScore = 0;
  const matchingSkills: string[] = [];

  const userSkillsLower = (user.skills || []).map((s) => s.toLowerCase());
  const oppSkills = opportunity.skills || [];

  if (oppSkills.length > 0) {
    let skillHits = 0;
    for (const reqSkill of oppSkills) {
      const isMatch = userSkillsLower.some(
        (us) => us.includes(reqSkill.toLowerCase()) || reqSkill.toLowerCase().includes(us)
      );
      if (isMatch) {
        skillHits++;
        matchingSkills.push(reqSkill);
      }
    }
    const skillRatio = skillHits / oppSkills.length;
    matchScore += skillRatio * 50; // Skills account for 50%
  } else {
    matchScore += 30; // Base score if no specific skills listed
  }

  // Course / Degree Program Alignment (30%)
  let courseAlignment = false;
  const userCourseLower = (user.course || '').toLowerCase();
  const oppTitleAndDesc = `${opportunity.title || ''} ${opportunity.description || ''}`.toLowerCase();

  if (
    (userCourseLower.includes('information technology') || userCourseLower.includes('computer science')) &&
    (oppTitleAndDesc.includes('developer') ||
      oppTitleAndDesc.includes('software') ||
      oppTitleAndDesc.includes('tech') ||
      oppTitleAndDesc.includes('qa') ||
      oppTitleAndDesc.includes('mobile'))
  ) {
    courseAlignment = true;
    matchScore += 30;
  } else if (
    userCourseLower.includes('nursing') &&
    (oppTitleAndDesc.includes('nurse') || oppTitleAndDesc.includes('health') || oppTitleAndDesc.includes('clinic'))
  ) {
    courseAlignment = true;
    matchScore += 30;
  } else if (
    userCourseLower.includes('education') &&
    (oppTitleAndDesc.includes('teacher') || oppTitleAndDesc.includes('instructor') || oppTitleAndDesc.includes('education'))
  ) {
    courseAlignment = true;
    matchScore += 30;
  } else if (
    userCourseLower.includes('business') &&
    (oppTitleAndDesc.includes('manager') || oppTitleAndDesc.includes('accountant') || oppTitleAndDesc.includes('marketing') || oppTitleAndDesc.includes('sales'))
  ) {
    courseAlignment = true;
    matchScore += 30;
  } else {
    matchScore += 15;
  }

  // Location Alignment (20%)
  let locationAlignment = false;
  const userLoc = (user.location || '').toLowerCase();
  const oppLoc = (opportunity.location || '').toLowerCase();
  if (oppLoc.includes('remote') || oppLoc.includes('hybrid') || (userLoc && oppLoc.includes(userLoc.split(',')[0].toLowerCase()))) {
    locationAlignment = true;
    matchScore += 20;
  } else {
    matchScore += 10;
  }

  return {
    opportunityId: opportunity.id,
    title: opportunity.title,
    company: opportunity.company,
    matchScore: Math.min(100, Math.round(matchScore)),
    matchingSkills,
    courseAlignment,
    locationAlignment
  };
}

/**
 * Automatic Duplicate Record Detection
 */
export function detectDuplicateRecords(users: UserProfile[]): DuplicateRecordFlag[] {
  const duplicates: DuplicateRecordFlag[] = [];
  const seenStudentIds = new Map<string, UserProfile>();
  const seenEmails = new Map<string, UserProfile>();

  for (const user of users) {
    // 1. Check Student ID duplicates
    if (user.studentId && user.studentId.trim().length > 3) {
      const normalizedId = user.studentId.trim().toUpperCase();
      if (seenStudentIds.has(normalizedId)) {
        const primary = seenStudentIds.get(normalizedId)!;
        duplicates.push({
          id: `dup_id_${primary.uid}_${user.uid}`,
          primaryUid: primary.uid,
          primaryName: primary.name,
          potentialDuplicateUid: user.uid,
          potentialDuplicateName: user.name,
          matchCriteria: 'studentId',
          confidenceScore: 98,
          detectedAt: new Date().toISOString(),
          status: 'open'
        });
      } else {
        seenStudentIds.set(normalizedId, user);
      }
    }

    // 2. Check Email duplicates
    if (user.email) {
      const normalizedEmail = user.email.trim().toLowerCase();
      if (seenEmails.has(normalizedEmail)) {
        const primary = seenEmails.get(normalizedEmail)!;
        duplicates.push({
          id: `dup_mail_${primary.uid}_${user.uid}`,
          primaryUid: primary.uid,
          primaryName: primary.name,
          potentialDuplicateUid: user.uid,
          potentialDuplicateName: user.name,
          matchCriteria: 'email',
          confidenceScore: 95,
          detectedAt: new Date().toISOString(),
          status: 'open'
        });
      } else {
        seenEmails.set(normalizedEmail, user);
      }
    }
  }

  return duplicates;
}

/**
 * Automatic Incomplete Record Scanner
 */
export function detectIncompleteRecords(users: UserProfile[]): IncompleteRecordFlag[] {
  return users
    .filter((u) => u.role === 'alumni')
    .map((user) => {
      const completion = calculateProfileCompletion(user);
      return {
        uid: user.uid,
        name: user.name,
        batch: user.batch,
        email: user.email,
        missingFields: completion.missingFields,
        completionPercentage: completion.percentage,
        lastReminderSentAt: user.lastProfileUpdateReminder
      };
    })
    .filter((record) => record.completionPercentage < 75)
    .sort((a, b) => a.completionPercentage - b.completionPercentage);
}

/**
 * Automatic Alumni Statistics and Tracer Report Generator
 */
export function generateAlumniReport(
  users: UserProfile[],
  period: 'monthly' | 'yearly' | 'ad-hoc' = 'monthly'
): AlumniReportSummary {
  const alumniUsers = users.filter((u) => u.role === 'alumni');
  const totalAlumni = alumniUsers.length || 1;

  const verifiedCount = alumniUsers.filter((u) => u.isVerified).length;
  const verifiedRate = Math.round((verifiedCount / totalAlumni) * 100);

  const employedCount = alumniUsers.filter(
    (u) => u.employmentStatus === 'Employed' || u.employmentStatus === 'Self-employed' || u.currentPosition
  ).length;
  const employmentRate = Math.round((employedCount / totalAlumni) * 100);

  // Industry aggregation
  const industryCounts: Record<string, number> = {
    'Technology & Software': 0,
    'Healthcare & Nursing': 0,
    'Education & Academics': 0,
    'Business & Finance': 0,
    'Engineering & Construction': 0,
    'Government & Public Service': 0,
    'Other Sectors': 0
  };

  alumniUsers.forEach((u) => {
    const text = `${u.course || ''} ${u.currentPosition || ''} ${u.headline || ''} ${u.company || ''}`.toLowerCase();
    if (text.includes('tech') || text.includes('software') || text.includes('developer') || text.includes('it') || text.includes('computer')) {
      industryCounts['Technology & Software']++;
    } else if (text.includes('nurse') || text.includes('health') || text.includes('hospital') || text.includes('clinical')) {
      industryCounts['Healthcare & Nursing']++;
    } else if (text.includes('teach') || text.includes('educat') || text.includes('professor') || text.includes('school')) {
      industryCounts['Education & Academics']++;
    } else if (text.includes('finance') || text.includes('bank') || text.includes('accountant') || text.includes('business')) {
      industryCounts['Business & Finance']++;
    } else if (text.includes('engineer') || text.includes('construction') || text.includes('architect')) {
      industryCounts['Engineering & Construction']++;
    } else {
      industryCounts['Other Sectors']++;
    }
  });

  const topIndustries = Object.entries(industryCounts)
    .map(([industry, count]) => ({
      industry,
      count,
      percentage: Math.round((count / totalAlumni) * 100)
    }))
    .sort((a, b) => b.count - a.count);

  // Batch distribution
  const batchMap = new Map<string, number>();
  alumniUsers.forEach((u) => {
    const b = u.batch || 'Unspecified';
    batchMap.set(b, (batchMap.get(b) || 0) + 1);
  });
  const batchDistribution = Array.from(batchMap.entries())
    .map(([batch, count]) => ({ batch, count }))
    .sort((a, b) => b.batch.localeCompare(a.batch));

  // Geographic distribution
  const geoMap = new Map<string, number>();
  alumniUsers.forEach((u) => {
    const loc = u.location || 'Cebu, Philippines';
    const region = loc.includes('Cebu')
      ? 'Cebu Metropolitan'
      : loc.includes('Manila')
      ? 'National Capital Region (NCR)'
      : loc.includes('Davao')
      ? 'Davao / Mindanao'
      : loc.includes('USA') || loc.includes('Singapore') || loc.includes('Canada') || loc.includes('Australia')
      ? 'International / Overseas'
      : 'Other Visayas / Provincial';
    geoMap.set(region, (geoMap.get(region) || 0) + 1);
  });
  const geographicDistribution = Array.from(geoMap.entries()).map(([region, count]) => ({
    region,
    count
  }));

  return {
    id: `report_${Date.now()}`,
    title: `St. Cecilia's College Alumni Tracer & Engagement Summary (${(period || 'monthly').toUpperCase()})`,
    period,
    generatedAt: new Date().toISOString(),
    totalAlumni,
    verifiedRate,
    employmentRate,
    topIndustries,
    batchDistribution,
    geographicDistribution,
    activeEngagementRate: 84
  };
}
