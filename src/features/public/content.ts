/**
 * Public-site content for The Church of Pentecost — Ipswich PIWC.
 *
 * EDIT ME: everything visitors read on the (single-page) public site lives
 * here so the page stays presentational. Update service times, the address,
 * social links, etc. in one place — no component edits needed.
 *
 * Photos live in `public/images/` (banner + gallery).
 */

export const church = {
  name: 'Ipswich PIWC',
  fullName: 'The Church of Pentecost — Ipswich PIWC',
  parent: 'The Church of Pentecost',
  centre: 'Pentecost International Worship Centre',
  tagline:
    'A family of every nation, worshipping Jesus in the heart of Ipswich.',
  // From the church's own "Invite you to church this Sunday" flyer.
  venue: 'Castle Hill Community Centre',
  address: {
    line1: 'Castle Hill Community Centre, Highfield Road',
    line2: 'Ipswich',
    county: 'Suffolk',
    postcode: 'IP1 6DG',
    country: 'United Kingdom',
  },
  // Used for the map + "Get directions" links.
  mapsQuery: 'Castle Hill Community Centre, Highfield Road, Ipswich IP1 6DG',
} as const

/**
 * TikTok — set the church's handle (without the @) and the home page shows a
 * "Latest on TikTok" section with the account's newest videos, pulled live
 * from TikTok's official creator embed. Leave empty to hide the section.
 */
export const tiktok = {
  username: 'ipswich.piwc',
} as const

export const tiktokProfileUrl = (username: string) =>
  `https://www.tiktok.com/@${username}`

// Only accounts that exist — add others here when they have real links.
export const social = [
  {
    label: 'TikTok',
    href: tiktokProfileUrl(tiktok.username),
    icon: 'tiktok',
  },
] as const

export type ServiceTime = {
  day: string
  name: string
  time: string
  detail: string
  /** Held online rather than at the venue — the platform's name. */
  online?: string
}

export const serviceTimes: ServiceTime[] = [
  {
    day: 'Sunday',
    name: 'Sunday Worship',
    time: '10:00',
    detail: 'Praise, the Word, and prayer for the whole family.',
  },
  {
    day: 'Monday',
    name: 'Transformation Hour',
    time: '23:00 — 00:10',
    detail: 'Holy Spirit–empowered midnight prayer, online.',
    online: 'Teams',
  },
]

// Home page copy.
export const home = {
  welcome:
    'Whether you’re exploring faith for the first time or looking for a church to call home, you’ll find a family here — people from many nations worshipping, praying and doing life together.',
  firstVisit: [
    {
      title: 'Come as you are',
      body: 'No dress code, no pressure — just a warm welcome and a place to belong.',
    },
    {
      title: 'Bring the whole family',
      body: 'Children and youth are cared for in vibrant, age-appropriate groups.',
    },
    {
      title: 'Worship and the Word',
      body: 'Heartfelt praise, honest prayer, and teaching straight from the Bible.',
    },
  ],
} as const

// Home banner slides — each photo brings its own headline. Landscape photos
// look sharpest on wide screens; `position` keeps faces in frame.
export type HeroSlide = {
  image: string
  /** Focal point (CSS object-position) so faces stay in frame when cropped. */
  position?: string
  label: string
  kicker: string
  title: string
  subtitle: string
}

export const heroSlides: HeroSlide[] = [
  {
    image: '/images/gallery/group-outdoor.webp',
    position: '50% 24%',
    label: 'Welcome',
    kicker: 'The Church of Pentecost · PIWC Ipswich',
    title: 'A family of every nation in the heart of Ipswich.',
    subtitle:
      'A Spirit-filled, welcoming church. Whoever you are and wherever you’re from, there’s a seat for you on Sunday.',
  },
  {
    image: '/images/gallery/praise-dance-wide.webp',
    position: '50% 42%',
    label: 'Sunday worship',
    kicker: 'Every Sunday at 10:00',
    title: 'Come and worship with us this Sunday.',
    subtitle:
      'Praise, the Word and prayer for the whole family — at Castle Hill Community Centre.',
  },
  {
    image: '/images/hero.jpg',
    position: '50% 55%',
    label: 'Outreach',
    kicker: 'Out in our town',
    title: 'Carrying the hope of Jesus into Ipswich.',
    subtitle:
      'From the Cornhill to the Waterfront, we share God’s love with the people of our town.',
  },
  {
    image: '/images/community.jpg',
    position: '50% 35%',
    label: 'Youth',
    kicker: 'Youth & young adults',
    title: 'A generation living boldly for Christ.',
    subtitle:
      'Discipling the next generation to know Jesus and make Him known.',
  },
  {
    image: '/images/gallery/families-arriving.webp',
    position: '50% 38%',
    label: 'Family',
    kicker: 'Come as you are',
    title: 'Bring the whole family.',
    subtitle:
      'Children and youth are cared for in vibrant, age-appropriate groups.',
  },
]

// Transformation Hour — the Ipswich District's weekly midnight prayer line on
// Microsoft Teams (details from the official flyer + invitation).
export const transformationHour = {
  day: 'Monday',
  time: '11:00pm — 12:10am',
  title: 'Transformation Hour',
  tagline: 'Holy Spirit empowered midnight prayer',
  platform: 'Microsoft Teams',
  joinUrl:
    'https://teams.microsoft.com/meet/357152399201682?p=i5z27jnJZMM4gHy1xv',
  meetingId: '357 152 399 201 682',
  passcode: 'dR7mG3Xv',
  // Prayer requests are welcome on WhatsApp (+44 from outside the UK).
  whatsapp: { display: '07747 427657', international: '447747427657' },
  image: '/images/transformation-hour.webp',
} as const

// Church photos — 1080p stills from our TikTok videos plus outreach photos.
// Add more by dropping files in `public/images/gallery/`.
export type GalleryPhoto = { src: string; caption: string; position?: string }

export const gallery: GalleryPhoto[] = [
  { src: '/images/gallery/group-outdoor.webp', caption: 'Our church family' },
  {
    src: '/images/gallery/portrait-green.webp',
    caption: 'Sunday service',
    position: '50% 18%',
  },
  {
    src: '/images/gallery/singers.webp',
    caption: 'Leading worship',
    position: '50% 22%',
  },
  { src: '/images/gallery/greeting.webp', caption: 'A warm welcome' },
  {
    src: '/images/gallery/pulpit-readers.webp',
    caption: 'The Word read aloud',
  },
  {
    src: '/images/gallery/womens-week-arrival.webp',
    caption: 'Area Women’s Week',
  },
  {
    src: '/images/gallery/worship-singing.webp',
    caption: 'Praise and worship',
  },
  {
    src: '/images/community.jpg',
    caption: 'Out on the Ipswich Waterfront',
    position: '50% 40%',
  },
]

/**
 * The Church of Pentecost's core values, as listed by the church worldwide
 * (thecophq.org/core-values). Short descriptions are summaries.
 */
export const coreValues: { title: string; body: string }[] = [
  {
    title: 'Evangelism',
    body: 'Every member shares Jesus in the power of the Holy Spirit, planting churches across cultures and nations.',
  },
  {
    title: 'Discipleship',
    body: 'Teaching and training believers to be like Christ in character and to make responsible choices.',
  },
  {
    title: 'Ministry excellence',
    body: 'Doing everything to the highest standard we can, because it is done for God.',
  },
  {
    title: 'Prayer',
    body: 'A praying church — seeking God together, including for the baptism and gifts of the Holy Spirit.',
  },
  {
    title: 'Ministry of the Holy Spirit',
    body: 'The Christian life is lived by the Spirit’s enabling, and His presence shapes all we do.',
  },
  {
    title: 'Leadership development',
    body: 'Leaders are raised from within, called by character, gifting and the leading of the Holy Spirit.',
  },
  {
    title: 'Church culture',
    body: 'Self-support, integrity, discipline and fellowship, with everyone equal regardless of background.',
  },
  {
    title: 'Tithes and offering',
    body: 'Members give faithfully to support the work of ministry, trusting God to provide.',
  },
  {
    title: 'Social action',
    body: 'Caring for our communities through health, education and practical help for those in need.',
  },
  {
    title: 'Holiness',
    body: 'Members and officers are called to live lives set apart for God.',
  },
  {
    title: 'Consistent Bible teaching',
    body: 'Sound, Bible-based doctrine taught faithfully, with false teaching guarded against.',
  },
  {
    title: 'Church discipline',
    body: 'Loving accountability, regular fellowship and respect for the order of the church.',
  },
]

export const scripture = {
  text: 'How good and pleasant it is when God’s people live together in unity!',
  reference: 'Psalm 133:1',
} as const

// The public site is one page — nav links scroll to its sections.
export const navLinks = [
  { label: 'Welcome', hash: 'about' },
  { label: 'When we meet', hash: 'times' },
  { label: 'Transformation Hour', hash: 'transformation-hour' },
  { label: 'Our values', hash: 'values' },
  { label: 'Prayer', hash: 'prayer' },
  { label: 'Find us', hash: 'visit' },
] as const
