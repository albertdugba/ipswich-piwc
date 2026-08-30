export const membershipStatusValues = [
  'VISITOR',
  'REGULAR_ATTENDEE',
  'MEMBER',
  'INACTIVE',
  'DECEASED',
] as const
export type MembershipStatus = (typeof membershipStatusValues)[number]

export const membershipStatusLabels: Record<MembershipStatus, string> = {
  VISITOR: 'Visitor',
  REGULAR_ATTENDEE: 'Regular attendee',
  MEMBER: 'Member',
  INACTIVE: 'Inactive',
  DECEASED: 'Deceased',
}

export const genderValues = ['MALE', 'FEMALE'] as const
export type Gender = (typeof genderValues)[number]

export const genderLabels: Record<Gender, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
}

export const maritalStatusValues = [
  'SINGLE',
  'MARRIED',
  'WIDOWED',
  'DIVORCED',
  'SEPARATED',
] as const
export type MaritalStatus = (typeof maritalStatusValues)[number]

export const maritalStatusLabels: Record<MaritalStatus, string> = {
  SINGLE: 'Single',
  MARRIED: 'Married',
  WIDOWED: 'Widowed',
  DIVORCED: 'Divorced',
  SEPARATED: 'Separated',
}

export const departmentRoleValues = [
  'LEADER',
  'ASSISTANT_LEADER',
  'MEMBER',
] as const
export type DepartmentRole = (typeof departmentRoleValues)[number]

export const departmentRoleLabels: Record<DepartmentRole, string> = {
  LEADER: 'Leader',
  ASSISTANT_LEADER: 'Assistant leader',
  MEMBER: 'Member',
}

export const contributionKindValues = [
  'MONTHLY_DUES',
  'MINISTRY_DUES',
  'BEREAVEMENT',
  'SPECIAL',
] as const
export type ContributionKind = (typeof contributionKindValues)[number]

export const contributionKindLabels: Record<ContributionKind, string> = {
  MONTHLY_DUES: 'Monthly dues',
  MINISTRY_DUES: 'Ministry dues',
  BEREAVEMENT: 'Bereavement',
  SPECIAL: 'Special collection',
}

export const contributionKindHints: Record<ContributionKind, string> = {
  MONTHLY_DUES: 'Regular dues collected from the whole church.',
  MINISTRY_DUES: 'Dues for one ministry — only its members are listed.',
  BEREAVEMENT: 'Support for a member who has lost a loved one.',
  SPECIAL: 'A one-off appeal or project collection.',
}

export const paymentMethodValues = ['CASH', 'BANK_TRANSFER', 'OTHER'] as const
export type PaymentMethod = (typeof paymentMethodValues)[number]

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank transfer',
  OTHER: 'Other',
}

export const attendanceStatusValues = ['PRESENT', 'ABSENT'] as const
export type AttendanceStatus = (typeof attendanceStatusValues)[number]

export const relationshipTypeValues = [
  'SPOUSE',
  'PARENT',
  'CHILD',
  'SIBLING',
  'GUARDIAN',
] as const
export type RelationshipType = (typeof relationshipTypeValues)[number]

export const followUpStatusValues = [
  'NEW',
  'IN_PROGRESS',
  'CONTACTED',
  'COMPLETED',
  'NOT_INTERESTED',
] as const
export type FollowUpStatus = (typeof followUpStatusValues)[number]

export const prayerStatusValues = [
  'NEW',
  'BEING_PRAYED_FOR',
  'ANSWERED',
  'ARCHIVED',
] as const
export type PrayerStatus = (typeof prayerStatusValues)[number]

export const prayerVisibilityValues = ['PRIVATE', 'PUBLIC'] as const
export type PrayerVisibility = (typeof prayerVisibilityValues)[number]

export const testimonyStatusValues = [
  'PENDING',
  'APPROVED',
  'PUBLISHED',
  'REJECTED',
] as const
export type TestimonyStatus = (typeof testimonyStatusValues)[number]

export const appRoleValues = [
  'SUPER_ADMIN',
  'PASTOR',
  'CHURCH_ADMIN',
  'DEPARTMENT_LEADER',
  'FINANCE_USER',
  'ATTENDANCE_VOLUNTEER',
  'MEMBER',
] as const
export type AppRole = (typeof appRoleValues)[number]
