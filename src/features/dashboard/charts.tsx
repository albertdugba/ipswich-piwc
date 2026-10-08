import type * as React from 'react'
import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export interface ChartPoint {
  label: string
  value: number
}

/** Track a container's rendered width so SVG charts draw at real pixels (no distortion). */
function useContainerWidth(fallback = 640) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(fallback)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w && w > 0) setWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return { ref, width }
}

/** Catmull-Rom spline expressed as cubic béziers — a smooth line through every point. */
function smoothPath(points: [number, number][]): string {
  const first = points[0]
  if (!first) return ''
  if (points.length === 1) return `M ${first[0]} ${first[1]}`
  const d = [`M ${first[0]} ${first[1]}`]
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    if (!p1 || !p2) continue
    const p0 = points[i - 1] ?? p1
    const p3 = points[i + 2] ?? p2
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6
    d.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`)
  }
  return d.join(' ')
}

/**
 * Indices whose x-axis label should be drawn so labels never collide on narrow
 * screens. Always keeps the latest point and steps back from there.
 */
function visibleLabelIndices(count: number, slot: number, minGap = 46) {
  const step = Math.max(1, Math.ceil(minGap / Math.max(slot, 1)))
  const shown = new Set<number>()
  for (let i = count - 1; i >= 0; i -= step) shown.add(i)
  return shown
}

/** Shorter plots on phones so a chart never fills the whole screen. */
function responsiveHeight(width: number, height: number) {
  return width < 480 ? Math.round(height * 0.8) : height
}

/**
 * Hover on desktop, tap on touch: a touch pointer leaving the chart (which
 * fires right after the finger lifts) shouldn't hide the tooltip it just
 * opened — only a mouse leaving does.
 */
function clearOnMouseLeave(setActive: (i: number | null) => void) {
  return (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') setActive(null)
  }
}

function ChartTooltip({
  x,
  y,
  containerWidth,
  title,
  value,
}: {
  x: number
  y: number
  containerWidth: number
  title: string
  value: string
}) {
  // Keep the bubble inside the card horizontally.
  const clampedX = Math.min(Math.max(x, 56), containerWidth - 56)
  return (
    <div
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-neutral-900 px-2.5 py-1.5 text-center whitespace-nowrap text-white shadow-lg"
      style={{ left: clampedX, top: y - 12 }}
    >
      <span className="block text-sm font-semibold tabular-nums">{value}</span>
      <span className="block text-[10px] text-white/60">{title}</span>
    </div>
  )
}

/** Smooth gradient area chart — for continuous trends (e.g. membership growth). */
export function AreaChart({
  data,
  height: heightProp = 210,
  formatValue = (n) => n.toLocaleString(),
  ariaLabel,
}: {
  data: ChartPoint[]
  height?: number
  formatValue?: (n: number) => string
  ariaLabel?: string
}) {
  const { ref, width } = useContainerWidth()
  const [active, setActive] = useState<number | null>(null)
  const gradientId = useId()
  const height = responsiveHeight(width, heightProp)

  const pad = { top: 18, right: 14, bottom: 26, left: 14 }
  const innerW = Math.max(width - pad.left - pad.right, 1)
  const innerH = Math.max(height - pad.top - pad.bottom, 1)
  const labelIdx = visibleLabelIndices(
    data.length,
    innerW / Math.max(data.length - 1, 1),
  )

  const values = data.map((d) => d.value)
  const max = Math.max(...values, 1)
  const min = Math.min(...values)
  const span = max - min || 1
  const domainMax = max + span * 0.18
  const domainMin = Math.max(0, min - span * 0.18)
  const domainSpan = domainMax - domainMin || 1

  const xOf = (i: number) =>
    pad.left +
    (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW)
  const yOf = (v: number) =>
    pad.top + innerH - ((v - domainMin) / domainSpan) * innerH

  const pts = data.map((d, i) => [xOf(i), yOf(d.value)] as [number, number])
  const line = smoothPath(pts)
  const area = `${line} L ${xOf(data.length - 1)} ${pad.top + innerH} L ${xOf(0)} ${pad.top + innerH} Z`
  const gridYs = [0, 0.25, 0.5, 0.75, 1].map((t) => pad.top + t * innerH)

  return (
    <div ref={ref} className="relative w-full text-muted-foreground">
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={ariaLabel}
        className="touch-pan-y overflow-visible select-none"
        onPointerLeave={clearOnMouseLeave(setActive)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-brand-500)"
              stopOpacity="0.35"
            />
            <stop
              offset="100%"
              stopColor="var(--color-brand-500)"
              stopOpacity="0.02"
            />
          </linearGradient>
        </defs>

        {gridYs.map((gy, i) => (
          <line
            key={i}
            x1={pad.left}
            x2={width - pad.right}
            y1={gy}
            y2={gy}
            stroke="currentColor"
            strokeOpacity={0.12}
            strokeDasharray={i === gridYs.length - 1 ? undefined : '3 4'}
          />
        ))}

        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke="var(--color-brand-600)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {active !== null && pts[active] && (
          <line
            x1={pts[active][0]}
            x2={pts[active][0]}
            y1={pad.top}
            y2={pad.top + innerH}
            stroke="var(--color-brand-500)"
            strokeOpacity={0.4}
            strokeDasharray="3 3"
          />
        )}

        {pts.map(([px, py], i) => {
          const isActive = active === i
          const isLast = i === pts.length - 1
          if (!isActive && !isLast) return null
          return (
            <g key={i}>
              <circle
                cx={px}
                cy={py}
                r={isActive ? 7 : 5}
                fill="var(--color-brand-600)"
                fillOpacity={0.15}
              />
              <circle
                cx={px}
                cy={py}
                r={isActive ? 4.5 : 3.5}
                fill="var(--color-brand-600)"
                stroke="var(--color-card, #fff)"
                strokeWidth={2}
              />
            </g>
          )
        })}

        {data.map((d, i) =>
          labelIdx.has(i) ? (
            <text
              key={d.label}
              x={xOf(i)}
              y={height - 8}
              textAnchor="middle"
              fill="currentColor"
              fontSize={11}
              className={cn(active === i && 'font-semibold')}
            >
              {d.label}
            </text>
          ) : null,
        )}

        {/* Invisible hit areas for hover. */}
        {data.map((d, i) => {
          const bandW = innerW / Math.max(data.length - 1, 1)
          return (
            <rect
              key={`hit-${d.label}`}
              x={xOf(i) - bandW / 2}
              y={0}
              width={bandW}
              height={height}
              fill="transparent"
              onPointerEnter={() => setActive(i)}
              onPointerDown={() => setActive(i)}
            />
          )
        })}
      </svg>

      {active !== null && data[active] && pts[active] && (
        <ChartTooltip
          x={pts[active][0]}
          y={pts[active][1]}
          containerWidth={width}
          title={data[active].label}
          value={formatValue(data[active].value)}
        />
      )}
    </div>
  )
}

/** Rounded bar chart with an optional average reference line — for discrete counts. */
export function BarChart({
  data,
  height: heightProp = 210,
  average,
  formatValue = (n) => n.toLocaleString(),
  ariaLabel,
}: {
  data: ChartPoint[]
  height?: number
  average?: number
  formatValue?: (n: number) => string
  ariaLabel?: string
}) {
  const { ref, width } = useContainerWidth()
  const [active, setActive] = useState<number | null>(null)
  const gradientId = useId()
  const height = responsiveHeight(width, heightProp)

  const pad = { top: 18, right: 4, bottom: 26, left: 4 }
  const innerW = Math.max(width - pad.left - pad.right, 1)
  const innerH = Math.max(height - pad.top - pad.bottom, 1)

  const max = Math.max(...data.map((d) => d.value), average ?? 0, 1)
  const domainMax = max * 1.1
  const slot = innerW / Math.max(data.length, 1)
  const barW = Math.min(slot * 0.6, 40)
  const labelIdx = visibleLabelIndices(data.length, slot)

  const yOf = (v: number) => pad.top + innerH - (v / domainMax) * innerH
  const xCenter = (i: number) => pad.left + slot * i + slot / 2
  const avgY = average != null ? yOf(average) : null

  return (
    <div ref={ref} className="relative w-full text-muted-foreground">
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={ariaLabel}
        className="touch-pan-y overflow-visible select-none"
        onPointerLeave={clearOnMouseLeave(setActive)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-500)" />
            <stop offset="100%" stopColor="var(--color-brand-600)" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={pad.left}
            x2={width - pad.right}
            y1={pad.top + t * innerH}
            y2={pad.top + t * innerH}
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeDasharray="3 4"
          />
        ))}
        <line
          x1={pad.left}
          x2={width - pad.right}
          y1={pad.top + innerH}
          y2={pad.top + innerH}
          stroke="currentColor"
          strokeOpacity={0.15}
        />

        {data.map((d, i) => {
          const isActive = active === i
          const isLast = i === data.length - 1
          const top = yOf(d.value)
          const barH = pad.top + innerH - top
          const highlight = isActive || isLast
          return (
            <g
              key={d.label}
              onPointerEnter={() => setActive(i)}
              onPointerDown={() => setActive(i)}
              className="cursor-default"
            >
              <rect
                x={xCenter(i) - slot / 2}
                y={0}
                width={slot}
                height={height}
                fill="transparent"
              />
              <rect
                x={xCenter(i) - barW / 2}
                y={top}
                width={barW}
                height={Math.max(barH, 2)}
                rx={4}
                fill={
                  highlight ? `url(#${gradientId})` : 'var(--color-brand-200)'
                }
                className="transition-all"
              />
              {labelIdx.has(i) ? (
                <text
                  x={xCenter(i)}
                  y={height - 8}
                  textAnchor="middle"
                  fill="currentColor"
                  fontSize={11}
                  className={cn(isActive && 'font-semibold')}
                >
                  {d.label}
                </text>
              ) : null}
            </g>
          )
        })}

        {avgY != null && (
          <>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={avgY}
              y2={avgY}
              stroke="var(--color-gold-600)"
              strokeWidth={1.5}
              strokeDasharray="5 4"
            />
            <text
              x={width - pad.right}
              y={avgY - 5}
              textAnchor="end"
              fill="var(--color-gold-700)"
              stroke="var(--card)"
              strokeWidth={4}
              paintOrder="stroke"
              fontSize={10}
              className="font-medium"
            >
              avg {formatValue(average!)}
            </text>
          </>
        )}
      </svg>

      {active !== null && data[active] && (
        <ChartTooltip
          x={xCenter(active)}
          y={yOf(data[active].value)}
          containerWidth={width}
          title={data[active].label}
          value={formatValue(data[active].value)}
        />
      )}
    </div>
  )
}

/** Tiny inline trend line for stat cards. */
export function Sparkline({
  data,
  width = 72,
  height = 24,
  className,
}: {
  data: number[]
  width?: number
  height?: number
  className?: string
}) {
  const gradientId = useId()
  if (data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const span = max - min || 1
  const pts = data.map(
    (v, i) =>
      [
        (i / (data.length - 1)) * width,
        height - 2 - ((v - min) / span) * (height - 4),
      ] as [number, number],
  )
  const line = smoothPath(pts)
  const area = `${line} L ${width} ${height} L 0 ${height} Z`
  return (
    <svg width={width} height={height} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor="var(--color-brand-500)"
            stopOpacity="0.25"
          />
          <stop
            offset="100%"
            stopColor="var(--color-brand-500)"
            stopOpacity="0"
          />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke="var(--color-brand-500)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export interface RankedBarItem {
  label: string
  value: number
}

/**
 * Horizontal ranked bars — one hue, sorted largest first. Reads far better
 * than a many-slice donut, especially on a phone.
 */
export function RankedBars({
  items,
  total,
  ariaLabel,
}: {
  items: RankedBarItem[]
  total: number
  ariaLabel?: string
}) {
  const sorted = [...items].sort((a, b) => b.value - a.value)
  const max = Math.max(...sorted.map((i) => i.value), 1)
  return (
    <ul aria-label={ariaLabel} className="space-y-3">
      {sorted.map((item) => {
        const pct = total ? Math.round((item.value / total) * 100) : 0
        return (
          <li key={item.label}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-foreground">
                {item.label}
              </span>
              <span className="shrink-0 tabular-nums">
                <span className="font-medium text-foreground">
                  {item.value}
                </span>
                <span className="ml-1.5 inline-block w-8 text-right text-xs text-muted-foreground">
                  {pct}%
                </span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-brand-50">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
