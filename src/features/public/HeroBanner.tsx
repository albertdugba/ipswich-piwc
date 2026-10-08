import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import { BackIcon, ChevronRightIcon, HugeiconsIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { Container } from './primitives'
import { EASE, RevealWords } from './motion'
import type { HeroSlide } from './content'

const AUTO_MS = 7000

/**
 * Home banner card. Each slide's photo cross-fades (no zoom) while its own
 * headline and line of text rise in. Auto-advances (pausing
 * when the tab is hidden), with arrows and labelled tabs to jump around.
 */
export function HeroBanner({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0)
  const [tick, setTick] = useState(0)
  const reduce = useReducedMotion()
  const count = slides.length

  const go = useCallback(
    (i: number) => {
      setIndex(((i % count) + count) % count)
      setTick((t) => t + 1)
    },
    [count],
  )

  useEffect(() => {
    if (reduce || count < 2) return
    const id = window.setTimeout(() => go(index + 1), AUTO_MS)
    return () => window.clearTimeout(id)
  }, [go, index, reduce, count, tick])

  // Parallax as the banner scrolls away: the photo sinks slower than the
  // page while the words lift and fade.
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const photoY = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? ['0%', '0%'] : ['0%', '16%'],
  )
  const contentY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -70])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0])

  const slide = slides[index]
  if (!slide) return null

  return (
    <section ref={sectionRef} className="bg-white pt-24 pb-4 sm:pt-28 sm:pb-6">
      <Container className="px-3 sm:px-8">
        <motion.div
          className="relative isolate flex min-h-[47rem] flex-col overflow-hidden rounded-[1.25rem] bg-brand-950 text-white sm:min-h-[44rem] sm:rounded-[1.75rem] lg:h-[min(88svh,52rem)]"
          role="region"
          aria-roledescription="carousel"
          aria-label="Welcome"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: EASE }}
        >
          {/* One photo per slide, covering the card; each slide's focal point
              keeps faces in frame. The active one fades in over the last; the
              layer is oversized so the parallax never shows an edge. */}
          {/* On phones the photo takes the top of the card and fades into
              the blue, so the text below never sits on anyone's face. */}
          <div className="absolute inset-x-0 top-0 -z-20 h-[58%] overflow-hidden sm:h-full">
            <motion.div
              className="absolute inset-x-0 -top-[8%] h-[124%]"
              style={{ y: photoY }}
            >
              <AnimatePresence initial={false}>
                <motion.div
                  key={slide.image}
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.4, ease: 'easeInOut' }}
                >
                  <img
                    src={slide.image}
                    alt=""
                    className="size-full object-cover"
                    style={{ objectPosition: slide.position ?? 'center' }}
                  />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
          <div
            aria-hidden
            className="absolute inset-x-0 top-[34%] -z-10 h-[25%] bg-linear-to-b from-transparent to-brand-950 sm:hidden"
          />

          {/* Scrims: deep royal blue from the bottom-left keeps text legible. */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-linear-to-t from-[oklch(0.18_0.04_266)]/90 via-[oklch(0.18_0.04_266)]/30 to-transparent lg:via-[oklch(0.18_0.04_266)]/20"
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-linear-to-r from-[oklch(0.18_0.04_266)]/55 via-transparent to-transparent lg:from-[oklch(0.18_0.04_266)]/45"
          />

          <motion.div
            className="flex flex-1 flex-col justify-end p-5 pt-16 sm:p-10 lg:p-14"
            style={{ y: contentY, opacity: contentOpacity }}
          >
            <div className="max-w-3xl lg:max-w-4xl">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={index}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -18 }}
                  transition={{ duration: 0.65, ease: EASE }}
                >
                  <p className="type-eyebrow tracking-[0.1em] text-white/80 sm:tracking-[0.14em]">
                    {slide.kicker}
                  </p>
                  <RevealWords
                    as="h1"
                    text={slide.title}
                    className="mt-4 block type-display lg:text-[3.75rem] lg:leading-[1.04]"
                  />
                  <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80 sm:mt-5 sm:type-lead">
                    {slide.subtitle}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="mt-7 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3">
                <Link
                  to="/"
                  hash="visit"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-ink transition-[color,background-color,border-color,scale] duration-200 ease-out active:scale-[0.97] hover:bg-white/90"
                >
                  Plan your visit
                  <HugeiconsIcon icon={ChevronRightIcon} className="size-4" />
                </Link>
                <a
                  href="#prayer"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/40 px-6 text-sm font-semibold text-white transition-[color,background-color,border-color,scale] duration-200 ease-out active:scale-[0.97] hover:bg-white/10"
                >
                  Send a prayer request
                </a>
              </div>
            </div>

            {/* Controls: which slide, and arrows to move between them. On
                desktop they sit level with the buttons so the text block stays
                low and clear of the faces in the photos. */}
            <div className="mt-10 flex items-center justify-between gap-4 lg:absolute lg:right-14 lg:bottom-14 lg:mt-0 lg:justify-end lg:gap-6">
              <div
                className="flex items-center gap-2"
                role="tablist"
                aria-label="Slides"
              >
                {slides.map((s, i) => {
                  const active = i === index
                  return (
                    <button
                      key={s.image}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      aria-label={`Slide ${i + 1}: ${s.label}`}
                      onClick={() => go(i)}
                      // Generous hit area around a small mark.
                      className="flex h-6 items-center"
                    >
                      <span
                        className={cn(
                          'relative block h-1.5 overflow-hidden rounded-full transition-[width,background-color] duration-300 ease-out',
                          active
                            ? 'w-8 bg-white/30'
                            : 'w-1.5 bg-white/45 hover:bg-white/80',
                        )}
                      >
                        {active ? (
                          <motion.span
                            key={tick}
                            className="absolute inset-y-0 left-0 rounded-full bg-white"
                            initial={{ width: reduce ? '100%' : '0%' }}
                            animate={{ width: '100%' }}
                            transition={{
                              duration: reduce ? 0 : AUTO_MS / 1000,
                              ease: 'linear',
                            }}
                          />
                        ) : null}
                      </span>
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <BannerArrow
                  label="Previous slide"
                  icon={BackIcon}
                  onClick={() => go(index - 1)}
                />
                <BannerArrow
                  label="Next slide"
                  icon={ChevronRightIcon}
                  onClick={() => go(index + 1)}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  )
}

function BannerArrow({
  label,
  icon,
  onClick,
}: {
  label: string
  icon: typeof BackIcon
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-10 items-center justify-center rounded-full border border-white/35 sm:size-11 text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-ink"
    >
      <HugeiconsIcon icon={icon} className="size-5" />
    </button>
  )
}
