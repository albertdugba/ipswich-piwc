import { useRef, type CSSProperties, type ReactNode } from 'react'
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * Motion vocabulary for the public site. A few signature moves, used
 * consistently: rise-in on scroll, word-by-word heading reveals, clip-path
 * photo reveals, gentle parallax. Every one falls back to a plain fade (or
 * nothing) under prefers-reduced-motion.
 */

/** Signature easing — a long, confident ease-out. */
export const EASE = [0.22, 1, 0.36, 1] as const

/** Trigger once the element is ~100px into the viewport, not at the edge. */
const VIEWPORT = { once: true, margin: '0px 0px -100px 0px' } as const

/** Fade + rise as the element scrolls into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 18,
}: {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: reduce ? 0.3 : 0.8, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}

const wordsParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045 } },
}
const wordChild: Variants = {
  hidden: { y: '105%' },
  show: { y: '0%', transition: { duration: 0.9, ease: EASE } },
}

/**
 * Splits text into words that rise from behind a mask, one after another —
 * the editorial headline reveal. Screen readers get the plain sentence.
 */
export function RevealWords({
  text,
  className,
  as: Tag = 'span',
}: {
  text: string
  className?: string
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p'
}) {
  const reduce = useReducedMotion()
  const MotionTag = motion[Tag]
  if (reduce) return <Tag className={className}>{text}</Tag>
  const words = text.split(' ')
  return (
    <MotionTag
      className={className}
      variants={wordsParent}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      aria-label={text}
    >
      {words.map((word, i) => (
        // pb/-mb keeps descenders (g, y, p) inside the mask.
        <span
          key={`${word}-${i}`}
          aria-hidden
          className="-mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-top"
        >
          <motion.span variants={wordChild} className="inline-block">
            {word}
            {i < words.length - 1 ? ' ' : null}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  )
}

/**
 * A photo that wipes into view (clip-path, bottom → top) and then drifts
 * gently with scroll. `strength` is the parallax travel as a % of height.
 */
export function ParallaxImage({
  src,
  alt,
  className,
  imgClassName,
  strength = 8,
  style,
  delay = 0,
}: {
  src: string
  alt: string
  className?: string
  imgClassName?: string
  strength?: number
  style?: CSSProperties
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? ['0%', '0%'] : [`-${strength}%`, `${strength}%`],
  )

  return (
    <motion.div
      ref={ref}
      className={cn('relative overflow-hidden', className)}
      initial={reduce ? { opacity: 0 } : { clipPath: 'inset(100% 0% 0% 0%)' }}
      whileInView={reduce ? { opacity: 1 } : { clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={VIEWPORT}
      transition={{ duration: reduce ? 0.3 : 1.1, ease: EASE, delay }}
    >
      <motion.img
        src={src}
        alt={alt}
        loading="lazy"
        // Oversized so the drift never shows an edge.
        className={cn(
          'absolute inset-x-0 -top-[10%] h-[120%] w-full object-cover will-change-transform',
          imgClassName,
        )}
        style={{ ...style, y }}
      />
    </motion.div>
  )
}

/** Comes into focus from a soft blur — for quotes and statements. */
export function BlurIn({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={
        reduce ? { opacity: 0 } : { opacity: 0, filter: 'blur(12px)', y: 10 }
      }
      whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: reduce ? 0.3 : 1.2, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

/** Parent + child variants for staggered lists (rows, cards). */
export const staggerList: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
}
export const staggerViewport = VIEWPORT
