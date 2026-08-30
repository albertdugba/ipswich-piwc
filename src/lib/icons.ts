/*
 * Central icon registry. The app uses Hugeicons (not Lucide). Components import
 * semantic names from here and render them with <HugeiconsIcon icon={...} />, so
 * swapping an icon is a one-line change in this file.
 */
export { HugeiconsIcon } from '@hugeicons/react'
export type { IconSvgElement } from '@hugeicons/react'

export {
  // Navigation / modules
  DashboardSquare01Icon as DashboardIcon,
  UserGroupIcon as MembersIcon,
  UserAdd01Icon as VisitorIcon,
  Building06Icon as MinistryIcon,
  CalendarCheckIn01Icon as AttendanceIcon,
  Coins01Icon as ContributionIcon,
  Notification03Icon as ReminderIcon,
  HandPrayerIcon as PrayerIcon,
  Comment01Icon as TestimonyIcon,
  Analytics01Icon as AnalyticsIcon,
  Settings01Icon as SettingsIcon,
  // Chrome
  Search01Icon as SearchIcon,
  Menu01Icon as MenuIcon,
  Notification03Icon as BellIcon,
  ChurchIcon,
  Compass01Icon as CompassIcon,
  // Dashboard & states
  BirthdayCakeIcon as BirthdayIcon,
  FavouriteIcon as AnniversaryIcon,
  Alert02Icon as AlertIcon,
  Loading03Icon as SpinnerIcon,
  InboxIcon,
  ArrowUpRight01Icon,
  ArrowDownRight01Icon,
  UserIcon,
  UserCheck01Icon,
  CalendarAdd01Icon as ActivityCalendarIcon,
  // Actions & profile
  Add01Icon as AddIcon,
  PencilEdit02Icon as EditIcon,
  Delete02Icon as DeleteIcon,
  MoreHorizontalIcon as MoreIcon,
  StarIcon,
  Mail01Icon as MailIcon,
  Call02Icon as PhoneIcon,
  Location01Icon as LocationIcon,
  Calendar03Icon as CalendarIcon,
  ArrowLeft01Icon as BackIcon,
  UserCircleIcon,
  // Primitive internals (dropdown, sheet, etc.)
  Tick02Icon as CheckIcon,
  ArrowRight01Icon as ChevronRightIcon,
  Cancel01Icon as CloseIcon,
  CircleIcon,
} from '@hugeicons/core-free-icons'
