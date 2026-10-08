import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { HugeiconsIcon, ChevronRightIcon } from '@/lib/icons'
import { church, navLinks } from './content'
import { Container } from './primitives'

// The welcome section sits right under the banner, so the header skips it.
const headerLinks = navLinks.filter((l) => l.hash !== 'about')

/**
 * Public header for the single-page site: logo, section links (desktop) and
 * "Plan your visit". No menu overlay — on phones people just scroll.
 */
export function PublicHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] transition-colors duration-300',
        scrolled
          ? 'border-b border-stone-200/80 bg-white/85 backdrop-blur-md'
          : 'border-b border-transparent bg-white',
      )}
    >
      <Container className="flex h-[4.75rem] items-center justify-between gap-6 sm:h-20">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-3"
          aria-label={`${church.name} — home`}
        >
          <img
            src="/piwc-logo.png"
            alt=""
            className="size-9 rounded-lg object-contain sm:size-10"
          />
          <span className="flex flex-col leading-tight">
            <span className="text-[15px] font-semibold tracking-tight text-ink">
              {church.name}
            </span>
            <span className="text-[11px] text-stone-500">{church.parent}</span>
          </span>
        </Link>

        <nav aria-label="Sections" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {headerLinks.map((link) => (
              <li key={link.hash}>
                <Link
                  to="/"
                  hash={link.hash}
                  className="text-sm font-medium whitespace-nowrap text-stone-600 transition-colors hover:text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          to="/"
          hash="visit"
          className="hidden h-10 shrink-0 items-center gap-1.5 rounded-full bg-brand-600 px-4 sm:inline-flex text-sm font-semibold text-white transition-[color,background-color,border-color,scale] duration-200 ease-out active:scale-[0.97] hover:bg-brand-700 sm:h-11 sm:px-5"
        >
          Plan your visit
          <HugeiconsIcon icon={ChevronRightIcon} className="size-4" />
        </Link>
      </Container>
    </header>
  )
}
