import {
  AnalyticsIcon,
  AttendanceIcon,
  ContributionIcon,
  DashboardIcon,
  MembersIcon,
  MinistryIcon,
  PrayerIcon,
  ReminderIcon,
  SettingsIcon,
  TestimonyIcon,
  type IconSvgElement,
} from '@/lib/icons'
import type { Permission } from '@/lib/auth/permissions'

/*
 * Single source of truth for the authenticated navigation (spec section 18).
 * Each item declares the permission required to see it; the sidebar filters
 * against the current user's role. Adding a module = adding an entry here, not
 * editing the sidebar component.
 */
export interface NavItem {
  label: string
  to: string
  icon: IconSvgElement
  /** Permission required to see this item; undefined = any authenticated user. */
  permission?: Permission
  /** Optional grouping label rendered above the item. */
  group?: string
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: DashboardIcon },

  // Visitors are not a separate module — they are Person records with
  // membershipStatus VISITOR, reachable from the Members status filter.
  {
    label: 'Members',
    to: '/people',
    icon: MembersIcon,
    permission: 'people:read',
  },
  {
    label: 'Ministries',
    to: '/ministries',
    icon: MinistryIcon,
    permission: 'departments:read',
  },
  {
    label: 'Attendance',
    to: '/attendance',
    icon: AttendanceIcon,
    permission: 'attendance:read',
  },
  {
    label: 'Contributions',
    to: '/contributions',
    icon: ContributionIcon,
    permission: 'contributions:read',
  },
  {
    label: 'Reminders',
    to: '/reminders',
    icon: ReminderIcon,
    permission: 'reminders:read',
  },
  {
    label: 'Prayer Requests',
    to: '/prayer-requests',
    icon: PrayerIcon,
    permission: 'prayer:read',
  },
  {
    label: 'Testimonies',
    to: '/testimonies',
    icon: TestimonyIcon,
    permission: 'testimonies:read',
  },
  {
    label: 'Analytics',
    to: '/analytics',
    icon: AnalyticsIcon,
    permission: 'analytics:read',
  },
  {
    label: 'Settings',
    to: '/settings',
    icon: SettingsIcon,
    permission: 'settings:manage',
  },
]
