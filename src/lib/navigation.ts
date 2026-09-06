import {
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

export interface NavItem {
  label: string
  to: string
  icon: IconSvgElement
  permission?: Permission
  group?: string
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: DashboardIcon },

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
    label: 'Settings',
    to: '/settings',
    icon: SettingsIcon,
    permission: 'settings:manage',
  },
]
