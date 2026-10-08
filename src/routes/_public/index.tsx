import { createFileRoute } from '@tanstack/react-router'
import {
  HugeiconsIcon,
  VideoIcon,
  CalendarIcon,
  ChevronRightIcon,
  DirectionsIcon,
  LocationIcon,
} from '@/lib/icons'
import {
  Container,
  DisplayHeading,
  Eyebrow,
  Section,
} from '@/features/public/primitives'
import { motion } from 'framer-motion'
import {
  BlurIn,
  ParallaxImage,
  Reveal,
  staggerItem,
  staggerList,
  staggerViewport,
} from '@/features/public/motion'
import { HeroBanner } from '@/features/public/HeroBanner'
import { ValuesRail } from '@/features/public/ValuesRail'
import { PrayerRequestSection } from '@/features/public/PrayerRequestForm'
import { TikTokFeed } from '@/features/public/TikTokFeed'
import {
  church,
  coreValues,
  gallery,
  heroSlides,
  home,
  scripture,
  serviceTimes,
  tiktok,
  transformationHour,
} from '@/features/public/content'

export const Route = createFileRoute('/_public/')({
  head: () => ({
    meta: [
      { title: `${church.name} — ${church.parent}` },
      {
        name: 'description',
        content: `${church.tagline} Sunday worship at ${church.venue}, ${church.address.line2}.`,
      },
    ],
  }),
  component: HomePage,
})

const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(church.mapsQuery)}`
const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(church.mapsQuery)}&output=embed`

function HomePage() {
  return (
    <>
      <HeroBanner slides={heroSlides} />
      <Week />
      <TransformationHour />
      <Welcome />
      <Values />
      {tiktok.username ? <TikTokFeed username={tiktok.username} /> : null}
      <Scripture />
      <PrayerRequestSection />
      <FindUs />
      <FirstVisit />
    </>
  )
}

/* ── Weekly timetable ─────────────────────────────────────────────── */

function Week() {
  return (
    <Section id="times" className="bg-white">
      <Container className="grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <Eyebrow>Every week</Eyebrow>
          <DisplayHeading className="mt-4">When we meet</DisplayHeading>
          <p className="mt-5 max-w-sm type-lead text-stone-600">
            We gather every Sunday, and pray together online on Monday nights.
            You’re welcome at both.
          </p>
        </Reveal>

        <Reveal className="lg:col-span-8" delay={0.1}>
          <motion.ul
            variants={staggerList}
            initial="hidden"
            whileInView="show"
            viewport={staggerViewport}
            className="divide-y divide-stone-200 border-y border-stone-200"
          >
            {serviceTimes.map((s) => (
              <motion.li
                variants={staggerItem}
                key={s.name}
                className="grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 py-6 sm:grid-cols-[8rem_1fr_auto] sm:py-8"
              >
                <span className="type-eyebrow text-stone-500">{s.day}</span>
                <span className="col-start-1 row-start-2 sm:col-start-2 sm:row-start-1">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1 type-h3 text-ink">
                    {s.name}
                    {s.online ? (
                      <span className="rounded-full border border-brand-200 px-2.5 py-0.5 font-public text-xs font-medium text-brand-700">
                        On {s.online}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1 block type-meta text-stone-500">
                    {s.detail}
                  </span>
                </span>
                <span className="col-start-2 row-span-2 row-start-1 type-h3 text-brand-700 tabular-nums sm:col-start-3 sm:row-span-1">
                  {s.time}
                </span>
              </motion.li>
            ))}
          </motion.ul>
        </Reveal>
      </Container>
    </Section>
  )
}

/* ── Transformation Hour (Monday midnight prayer on Teams) ──────────────────── */

function TransformationHour() {
  const th = transformationHour
  const whatsappHref = `https://wa.me/${th.whatsapp.international}?text=${encodeURIComponent(
    `Prayer request for ${th.title}: `,
  )}`

  return (
    <Section id="transformation-hour" className="bg-white pt-0 sm:pt-0">
      <Container className="px-3 sm:px-8">
        <div className="relative isolate grid items-center gap-10 overflow-hidden rounded-[1.25rem] bg-brand-950 p-5 pt-10 text-white sm:rounded-[1.75rem] sm:p-12 lg:grid-cols-12 lg:gap-14 lg:p-16">
          {/* The flyer itself, heavily blurred, glows behind the card; a
              navy tint on top keeps the text easy to read. */}
          <img
            src={th.image}
            alt=""
            aria-hidden
            loading="lazy"
            className="absolute inset-0 -z-20 size-full scale-125 object-cover opacity-95 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-linear-to-b from-brand-950/80 via-brand-950/50 to-brand-950/25 lg:bg-linear-to-r"
          />
          <Reveal className="lg:col-span-7">
            <Eyebrow onDark>
              Every {th.day} · {th.time}
            </Eyebrow>
            <DisplayHeading className="mt-4 text-white">
              {th.title}
            </DisplayHeading>
            <p className="mt-5 max-w-md type-lead text-white/75">
              {th.tagline}, online on {th.platform}. One hour, this and every{' '}
              {th.day} night.
            </p>

            <div className="mt-7 flex flex-col items-stretch gap-4 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
              <a
                href={th.joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-ink transition-[color,background-color,border-color,scale] duration-200 ease-out active:scale-[0.97] hover:bg-white/90"
              >
                <HugeiconsIcon icon={VideoIcon} className="size-4" />
                Join on Teams
              </a>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center text-sm font-medium text-white/80 underline sm:text-left decoration-white/30 underline-offset-4 transition-colors hover:text-white hover:decoration-white"
              >
                Send a prayer request on WhatsApp
              </a>
            </div>

            <p className="mt-6 text-sm text-white/45 tabular-nums">
              Meeting ID {th.meetingId} · Passcode {th.passcode}
            </p>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-5">
            <img
              src={th.image}
              alt={`${th.title} flyer — ${th.tagline}, every ${th.day} ${th.time} on ${th.platform}`}
              loading="lazy"
              width={1082}
              height={1454}
              className="mx-auto w-full max-w-sm rounded-xl shadow-2xl shadow-black/40 lg:max-w-none"
            />
          </Reveal>
        </div>
      </Container>
    </Section>
  )
}

/* ── Welcome statement ────────────────────────────────────────────── */

function Welcome() {
  // Clean shots only — no text baked into the photo.
  const strip = ['portrait-green', 'singers', 'greeting']
    .map((name) => gallery.find((p) => p.src.includes(name)))
    .filter((p) => p !== undefined)
  return (
    <Section id="about" className="bg-paper">
      <Container>
        <Reveal className="max-w-5xl">
          <Eyebrow>Welcome</Eyebrow>
          <p className="mt-4 type-statement text-ink">{home.welcome}</p>
          <p className="mt-6 max-w-2xl type-lead text-stone-600">
            {church.name} is a Pentecost International Worship Centre of{' '}
            {church.parent} — one of the fastest-growing Pentecostal churches in
            the world, present in over 150 nations. Here in Suffolk we gather to
            worship God, grow in His Word, and serve our town with the love of
            Christ.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-3 gap-3 sm:gap-5">
          {strip.map((p, i) => (
            <figure
              key={p.src}
              className={i === 1 ? 'translate-y-6 sm:translate-y-12' : ''}
            >
              <ParallaxImage
                src={p.src}
                alt={p.caption}
                delay={i * 0.12}
                // The middle photo drifts further, so the row feels layered.
                strength={i === 1 ? 12 : 6}
                className="aspect-3/4 w-full rounded-lg sm:rounded-xl"
                style={{ objectPosition: p.position ?? 'center' }}
              />
              <figcaption className="mt-3 hidden type-meta text-stone-500 sm:block">
                {p.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </Section>
  )
}

/* ── Core values ──────────────────────────────────────────────────── */

function Values() {
  return (
    <Section id="values" className="overflow-hidden bg-white">
      <Container>
        <Reveal className="max-w-2xl">
          <Eyebrow>Our core values</Eyebrow>
          <DisplayHeading className="mt-4">
            What shapes us as a church
          </DisplayHeading>
          <p className="mt-5 type-lead text-stone-600">
            We share the core values held by {church.parent} worldwide.
          </p>
        </Reveal>
        <div className="mt-10 sm:-mt-6">
          <ValuesRail items={coreValues} />
        </div>
      </Container>
    </Section>
  )
}

/* ── Find us (map) ────────────────────────────────────────────────── */

function FindUs() {
  const sunday = serviceTimes[0]
  return (
    <Section id="visit" className="bg-white">
      <Container className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-14">
        <Reveal className="lg:col-span-5">
          <Eyebrow>Find us</Eyebrow>
          <DisplayHeading className="mt-4">
            Join us at Castle Hill
          </DisplayHeading>
          <dl className="mt-8 space-y-6">
            <div className="flex gap-4">
              <dt className="flex size-11 shrink-0 items-center justify-center rounded-full border border-stone-200 text-brand-600">
                <HugeiconsIcon icon={LocationIcon} className="size-5" />
                <span className="sr-only">Address</span>
              </dt>
              <dd>
                <p className="type-body font-semibold text-ink">
                  {church.venue}
                </p>
                <p className="mt-0.5 type-meta text-stone-500">
                  Highfield Road, {church.address.line2}{' '}
                  {church.address.postcode}
                </p>
              </dd>
            </div>
            {sunday ? (
              <div className="flex gap-4">
                <dt className="flex size-11 shrink-0 items-center justify-center rounded-full border border-stone-200 text-brand-600">
                  <HugeiconsIcon icon={CalendarIcon} className="size-5" />
                  <span className="sr-only">Service time</span>
                </dt>
                <dd>
                  <p className="type-body font-semibold text-ink">
                    Every {sunday.day}, {sunday.time}
                  </p>
                  <p className="mt-0.5 type-meta text-stone-500">
                    {sunday.name}
                  </p>
                </dd>
              </div>
            ) : null}
          </dl>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-brand-600 px-6 text-sm font-semibold text-white transition-[color,background-color,border-color,scale] duration-200 ease-out active:scale-[0.97] hover:bg-brand-700"
          >
            <HugeiconsIcon icon={DirectionsIcon} className="size-4" />
            Get directions
          </a>
        </Reveal>

        <Reveal className="lg:col-span-7" delay={0.1}>
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-paper">
            <iframe
              src={mapEmbedUrl}
              title={`Map showing ${church.venue}, ${church.address.line2}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block aspect-4/3 w-full border-0 sm:aspect-16/10"
            />
          </div>
        </Reveal>
      </Container>
    </Section>
  )
}

/* ── Scripture ────────────────────────────────────────────────────── */

function Scripture() {
  return (
    <section className="bg-white py-24 sm:py-32">
      <Container>
        <BlurIn>
          <blockquote className="mx-auto max-w-4xl text-center">
            <p className="type-statement text-ink italic">“{scripture.text}”</p>
            <footer className="mt-6 type-eyebrow text-brand-600">
              {scripture.reference}
            </footer>
          </blockquote>
        </BlurIn>
      </Container>
    </section>
  )
}

/* ── First visit ──────────────────────────────────────────────────── */

function FirstVisit() {
  return (
    <section className="bg-brand-900 py-20 text-white sm:py-28">
      <Container className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-5">
          <Eyebrow onDark>First time?</Eyebrow>
          <DisplayHeading className="mt-4 text-white">
            We’ll save you a seat.
          </DisplayHeading>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-ink transition-[color,background-color,border-color,scale] duration-200 ease-out active:scale-[0.97] hover:bg-white/90"
            >
              Get directions
              <HugeiconsIcon icon={ChevronRightIcon} className="size-4" />
            </a>
          </div>
        </Reveal>

        <ol className="divide-y divide-white/15 self-end border-y border-white/15 lg:col-span-7">
          {home.firstVisit.map((step, i) => (
            <li key={step.title}>
              <Reveal
                delay={i * 0.06}
                className="grid grid-cols-[2.5rem_1fr] gap-x-4 py-6"
              >
                <span className="type-h3 text-gold-300 italic tabular-nums">
                  {i + 1}.
                </span>
                <span>
                  <span className="block type-h3">{step.title}</span>
                  <span className="mt-1.5 block type-body text-white/70">
                    {step.body}
                  </span>
                </span>
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}
