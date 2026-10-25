import { useCallback, useEffect, useRef, useState } from 'react'
import { BackIcon, ChevronRightIcon, HugeiconsIcon } from '@/lib/icons'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { staggerItem, staggerList, staggerViewport } from './motion'

/** Horizontally scrolling, numbered cards — swipe on phones, arrows on desktop. */
export function ValuesRail({
  items,
}: {
  items: { title: string; body: string }[]
}) {
  const railRef = useRef<HTMLOListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  const update = useCallback(() => {
    const el = railRef.current
    if (!el) return
    setEdges({
      start: el.scrollLeft < 8,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8,
    })
  }, [])

  useEffect(() => {
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [update])

  const scroll = (dir: 1 | -1) =>
    railRef.current?.scrollBy({
      left: dir * railRef.current.clientWidth * 0.8,
      behavior: 'smooth',
    })

  return (
    <div>
      <div className="mb-6 hidden justify-end gap-2 sm:flex">
        <RailButton
          label="Previous values"
          icon={BackIcon}
          disabled={edges.start}
          onClick={() => scroll(-1)}
        />
        <RailButton
          label="Next values"
          icon={ChevronRightIcon}
          disabled={edges.end}
          onClick={() => scroll(1)}
        />
      </div>
      <motion.ol
        variants={staggerList}
        initial="hidden"
        whileInView="show"
        viewport={staggerViewport}
        ref={railRef}
        onScroll={update}
        className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:-mx-8 sm:scroll-px-8 sm:px-8 lg:mx-0 lg:scroll-px-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((v, i) => (
          <motion.li
            variants={staggerItem}
            key={v.title}
            className="flex min-h-80 w-[78vw] max-w-80 shrink-0 snap-start flex-col justify-between rounded-xl bg-paper p-6 sm:w-80 sm:p-8"
          >
            <span className="font-display text-5xl leading-none font-light text-brand-600 italic tabular-nums">
              {i + 1}
            </span>
            <span>
              <span className="block type-h3 text-ink">{v.title}</span>
              <span className="mt-3 block type-body text-stone-600">
                {v.body}
              </span>
            </span>
          </motion.li>
        ))}
      </motion.ol>
    </div>
  )
}

function RailButton({
  label,
  icon,
  disabled,
  onClick,
}: {
  label: string
  icon: typeof BackIcon
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'flex size-11 items-center justify-center rounded-full border border-stone-300 bg-white text-ink transition-colors hover:border-brand-600 hover:bg-brand-600 hover:text-gold-400',
        'disabled:pointer-events-none disabled:opacity-35',
      )}
    >
      <HugeiconsIcon icon={icon} className="size-5" />
    </button>
  )
}
