export interface DashboardSummary {
  membership: {
    total: number
    active: number
    newThisMonth: number
    visitors: number
    totalTrendPct: number
  }
  attendance: {
    latestServiceName: string
    latestServiceDate: string
    latestCount: number
    average: number
    trendPct: number
    weekly: { label: string; count: number }[]
  }
  birthdays: {
    today: { name: string; age: number }[]
    thisWeek: { name: string; date: string; age: number }[]
  }
  anniversaries: {
    today: { couple: string; years: number }[]
    thisWeek: { couple: string; date: string; years: number }[]
  }
  membershipGrowth: {
    monthly: { label: string; total: number; joined: number }[]
  }
  needsAttention: {
    visitorsToFollowUp: number
    newPrayerRequests: number
    absentMembers: { name: string; weeks: number; lastSeen: string }[]
  }
  ministries: {
    total: number
    byMinistry: { name: string; count: number }[]
  }
  recentActivity: {
    id: string
    type:
      | 'MEMBER_ADDED'
      | 'VISITOR_REGISTERED'
      | 'ATTENDANCE_RECORDED'
      | 'PRAYER_SUBMITTED'
      | 'TESTIMONY_SUBMITTED'
    summary: string
    when: string
  }[]
}

export const dashboardMock: DashboardSummary = {
  membership: {
    total: 214,
    active: 186,
    newThisMonth: 7,
    visitors: 12,
    totalTrendPct: 4,
  },
  attendance: {
    latestServiceName: 'Sunday Worship',
    latestServiceDate: '9 August 2026',
    latestCount: 178,
    average: 165,
    trendPct: 6,
    weekly: [
      { label: 'Jun 22', count: 152 },
      { label: 'Jun 29', count: 148 },
      { label: 'Jul 06', count: 161 },
      { label: 'Jul 13', count: 170 },
      { label: 'Jul 20', count: 158 },
      { label: 'Jul 27', count: 169 },
      { label: 'Aug 03', count: 174 },
      { label: 'Aug 09', count: 178 },
    ],
  },
  birthdays: {
    today: [{ name: 'Ama Boateng', age: 32 }],
    thisWeek: [
      { name: 'John Mensah', date: 'Wed 12 Aug', age: 41 },
      { name: 'Sarah Owusu', date: 'Fri 14 Aug', age: 27 },
    ],
  },
  anniversaries: {
    today: [{ couple: 'John & Mary Mensah', years: 8 }],
    thisWeek: [
      { couple: 'David & Sarah Brown', date: 'Thu 13 Aug', years: 15 },
    ],
  },
  membershipGrowth: {
    monthly: [
      { label: 'Feb', total: 188, joined: 4 },
      { label: 'Mar', total: 193, joined: 6 },
      { label: 'Apr', total: 197, joined: 5 },
      { label: 'May', total: 201, joined: 5 },
      { label: 'Jun', total: 205, joined: 6 },
      { label: 'Jul', total: 209, joined: 5 },
      { label: 'Aug', total: 214, joined: 7 },
      { label: 'Sep', total: 214, joined: 2 },
    ],
  },
  needsAttention: {
    visitorsToFollowUp: 6,
    newPrayerRequests: 4,
    absentMembers: [
      { name: 'Kwame Boateng', weeks: 5, lastSeen: '3 Aug' },
      { name: 'Grace Adjei', weeks: 4, lastSeen: '10 Aug' },
      { name: 'Michael Osei', weeks: 3, lastSeen: '17 Aug' },
    ],
  },
  ministries: {
    total: 8,
    byMinistry: [
      { name: "Men's Ministry", count: 48 },
      { name: "Women's Ministry", count: 62 },
      { name: 'Youth Ministry', count: 39 },
      { name: 'Children Ministry', count: 44 },
      { name: 'Choir', count: 26 },
      { name: 'Prayer Ministry', count: 31 },
      { name: 'Media', count: 9 },
      { name: 'Evangelism', count: 18 },
    ],
  },
  recentActivity: [
    {
      id: '1',
      type: 'MEMBER_ADDED',
      summary: 'New member added — Abena Sarpong',
      when: '2 hours ago',
    },
    {
      id: '2',
      type: 'ATTENDANCE_RECORDED',
      summary: 'Attendance recorded for Sunday Worship (178)',
      when: 'Today, 12:40',
    },
    {
      id: '3',
      type: 'VISITOR_REGISTERED',
      summary: 'Visitor registered — Daniel Frimpong',
      when: 'Yesterday',
    },
    {
      id: '4',
      type: 'PRAYER_SUBMITTED',
      summary: 'New prayer request submitted',
      when: 'Yesterday',
    },
    {
      id: '5',
      type: 'TESTIMONY_SUBMITTED',
      summary: 'Testimony submitted — awaiting approval',
      when: '2 days ago',
    },
  ],
}
