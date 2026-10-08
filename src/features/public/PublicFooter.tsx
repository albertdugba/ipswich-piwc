import { Link } from '@tanstack/react-router'
import {
  HugeiconsIcon,
  ChevronRightIcon,
  TiktokIcon,
  type IconSvgElement,
} from '@/lib/icons'
import { church, serviceTimes, social } from './content'
import { Container } from './primitives'

const socialIcons: Record<string, IconSvgElement> = {
  tiktok: TiktokIcon,
}

const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(church.mapsQuery)}`

/** Who we are, when we gather, where to find us — nothing else. */
export function PublicFooter() {
  const year = new Date().getFullYear()
  const sunday = serviceTimes.find((s) => s.day === 'Sunday')

  return (
    <footer className="bg-brand-950 text-white">
      <Container className="grid gap-12 py-16 sm:grid-cols-2 sm:py-20 lg:grid-cols-12">
        <div className="sm:col-span-2 lg:col-span-6">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/piwc-logo.png"
              alt=""
              className="size-10 rounded-lg object-contain"
            />
            <span className="flex flex-col leading-tight">
              <span className="text-[15px] font-semibold">{church.name}</span>
              <span className="text-[11px] text-white/55">{church.parent}</span>
            </span>
          </Link>
          <p className="mt-6 max-w-sm type-statement text-white/90">
            {church.tagline}
          </p>
          {social.length ? (
            <div className="mt-6 flex gap-2">
              {social.map((s) => {
                const icon = socialIcons[s.icon]
                if (!icon) return null
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="inline-flex size-10 items-center justify-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-white/50 hover:text-white"
                  >
                    <HugeiconsIcon icon={icon} className="size-4" />
                  </a>
                )
              })}
            </div>
          ) : null}
        </div>

        {sunday ? (
          <div className="lg:col-span-3">
            <h3 className="type-eyebrow text-gold-300">Gather with us</h3>
            <p className="mt-4 type-h3">Every {sunday.day}</p>
            <p className="mt-1 type-body text-white/65">
              {sunday.name} at {sunday.time}
            </p>
          </div>
        ) : null}

        <div className="lg:col-span-3">
          <h3 className="type-eyebrow text-gold-300">Find us</h3>
          <address className="mt-4 type-body text-white/65 not-italic">
            <span className="block type-h3 text-white">{church.venue}</span>
            <span className="mt-1 block">
              Highfield Road, {church.address.line2} {church.address.postcode}
            </span>
          </address>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1 type-meta font-medium text-white underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-white"
          >
            Get directions
            <HugeiconsIcon icon={ChevronRightIcon} className="size-3.5" />
          </a>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="py-6 type-meta text-white/45">
          © {year} {church.fullName}
        </Container>
      </div>
    </footer>
  )
}
