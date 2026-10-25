import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import {
  BackIcon,
  ChevronRightIcon,
  CloseIcon,
  HugeiconsIcon,
  PlayIcon,
  TiktokIcon,
} from '@/lib/icons'
import { cn } from '@/lib/utils'
import { Container, DisplayHeading, Eyebrow, Section } from './primitives'
import { Reveal } from './motion'
import { tiktokProfileUrl } from './content'
import { getTikTokFeed, type TikTokProfile, type TikTokVideo } from './tiktok'

const compact = new Intl.NumberFormat('en-GB', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const relative = new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' })

function timeAgo(iso: string) {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days < 1) return 'Today'
  if (days < 7) return relative.format(-days, 'day')
  if (days < 30) return relative.format(-Math.round(days / 7), 'week')
  if (days < 365) return relative.format(-Math.round(days / 30), 'month')
  return relative.format(-Math.round(days / 365), 'year')
}

/** Captions are often all hashtags — show the words, fall back to the tags. */
function cleanCaption(caption: string) {
  const words = caption
    .replace(/#[^\s#]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return words || caption.trim()
}

/** True once the element is within `margin` of the viewport. */
function useNearViewport<T extends HTMLElement>(margin = '400px') {
  const ref = useRef<T>(null)
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || near) return
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setNear(true)
      },
      { rootMargin: `${margin} 0px` },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [margin, near])
  return { ref, near }
}

/**
 * "Latest on TikTok" — the account's newest videos as custom reel cards that
 * play in an on-site viewer. Data is fetched (server-side, cached) only once
 * the section nears the viewport. If TikTok's feed can't be read, it falls
 * back to TikTok's official creator widget.
 */
export function TikTokFeed({ username }: { username: string }) {
  const handle = username.replace(/^@/, '')
  const profileUrl = tiktokProfileUrl(handle)
  const { ref, near } = useNearViewport<HTMLDivElement>()

  const query = useQuery({
    queryKey: ['tiktok-feed', handle],
    queryFn: () => getTikTokFeed({ data: handle }),
    enabled: near,
    staleTime: 15 * 60 * 1000,
    retry: 1,
  })

  const feed = query.data
  const showFallback = query.isError || (query.isSuccess && !feed)

  return (
    <Section className="overflow-hidden bg-paper">
      <Container>
        <div ref={ref}>
          <Reveal className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-xl">
              <Eyebrow>Follow along</Eyebrow>
              <DisplayHeading className="mt-4">
                Life at PIWC, on TikTok
              </DisplayHeading>
              <p className="mt-5 max-w-xl type-lead text-stone-600">
                Moments from worship, youth nights and church life — straight
                from our TikTok.
              </p>
            </div>
            <FollowButton href={profileUrl} handle={handle} />
          </Reveal>

          <div className="mt-10 sm:mt-12">
            {showFallback ? (
              <OfficialEmbed handle={handle} profileUrl={profileUrl} />
            ) : feed ? (
              <ReelsRail
                videos={feed.videos.slice(0, 12)}
                profile={feed.profile}
              />
            ) : (
              <RailSkeleton />
            )}
          </div>
        </div>
      </Container>
    </Section>
  )
}

function FollowButton({ href, handle }: { href: string; handle: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-12 shrink-0 items-center gap-2 self-start rounded-full bg-brand-600 px-5 text-sm font-semibold text-gold-400 transition-[color,background-color,border-color,scale] duration-200 ease-out active:scale-[0.97] hover:bg-brand-700 sm:self-auto"
    >
      <HugeiconsIcon icon={TiktokIcon} className="size-4" />
      Follow @{handle}
    </a>
  )
}

const railClass =
  'flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain [scrollbar-width:none] sm:gap-4 lg:gap-5 [&::-webkit-scrollbar]:hidden ' +
  // Bleed to the screen edge on phones so cards visibly continue off-screen.
  '-mx-5 scroll-px-5 px-5 sm:-mx-8 sm:scroll-px-8 sm:px-8 lg:mx-0 lg:scroll-px-0 lg:px-0'

// Big cards: ~1¼ in view on phones (the next one peeks in), ~2½ on
// tablets, exactly three on desktop with arrows to page through.
const cardWidth =
  'w-[78vw] max-w-sm shrink-0 snap-start sm:w-[calc((100%-1rem)/2.4)] sm:max-w-none lg:w-[calc((100%-2.5rem)/3)]'

function ReelsRail({
  videos,
  profile,
}: {
  videos: TikTokVideo[]
  profile: TikTokProfile
}) {
  const railRef = useRef<HTMLDivElement>(null)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [edges, setEdges] = useState({ start: true, end: false })
  const [progress, setProgress] = useState(0)

  const updateEdges = useCallback(() => {
    const el = railRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setEdges({
      start: el.scrollLeft < 8,
      end: el.scrollLeft >= max - 8,
    })
    setProgress(max > 0 ? el.scrollLeft / max : 1)
  }, [])

  useEffect(() => {
    updateEdges()
    window.addEventListener('resize', updateEdges)
    return () => window.removeEventListener('resize', updateEdges)
  }, [updateEdges])

  const scrollBy = (dir: 1 | -1) => {
    const el = railRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-4">
        <a
          href={profile.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 items-center gap-3"
        >
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt=""
              referrerPolicy="no-referrer"
              className="size-9 shrink-0 rounded-full object-cover"
            />
          ) : null}
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-semibold text-ink">
              @{profile.username}
            </span>
            <span className="block text-xs text-stone-500 tabular-nums">
              {compact.format(profile.followerCount)} followers ·{' '}
              {compact.format(profile.likeCount)} likes
            </span>
          </span>
        </a>
        <div className="hidden shrink-0 gap-2 sm:flex">
          <RailArrow
            side="left"
            disabled={edges.start}
            onClick={() => scrollBy(-1)}
          />
          <RailArrow
            side="right"
            disabled={edges.end}
            onClick={() => scrollBy(1)}
          />
        </div>
      </div>

      <div>
        <div ref={railRef} onScroll={updateEdges} className={railClass}>
          {videos.map((v, i) => (
            <ReelCard
              key={v.id}
              video={v}
              isLatest={i === 0}
              profile={profile}
              onOpen={() => setOpenIndex(i)}
            />
          ))}
          <a
            href={profile.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              cardWidth,
              'group flex aspect-9/16 flex-col items-center justify-center gap-4 rounded-xl bg-brand-600 p-6 text-center text-white transition-colors hover:bg-brand-700',
            )}
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 transition-transform group-hover:scale-105">
              <HugeiconsIcon icon={TiktokIcon} className="size-6" />
            </span>
            <span className="type-h3">See more on TikTok</span>
            <span className="text-xs text-white/60">@{profile.username}</span>
          </a>
        </div>

        <div
          aria-hidden
          className="mt-6 h-0.5 overflow-hidden rounded-full bg-stone-200"
        >
          <div
            className="h-full rounded-full bg-brand-600 transition-[width] duration-150"
            style={{ width: `${Math.max(progress, 0.08) * 100}%` }}
          />
        </div>
      </div>

      <ReelViewer
        videos={videos}
        index={openIndex}
        onIndexChange={setOpenIndex}
      />
    </>
  )
}

function RailArrow({
  side,
  disabled,
  onClick,
}: {
  side: 'left' | 'right'
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === 'left' ? 'Previous videos' : 'Next videos'}
      className="flex size-11 items-center justify-center rounded-full border border-stone-300 bg-white text-ink transition-colors hover:border-brand-600 hover:bg-brand-600 hover:text-gold-400 disabled:pointer-events-none disabled:opacity-35"
    >
      <HugeiconsIcon
        icon={side === 'left' ? BackIcon : ChevronRightIcon}
        className="size-5"
      />
    </button>
  )
}

function ReelCard({
  video,
  isLatest,
  profile,
  onOpen,
}: {
  video: TikTokVideo
  isLatest: boolean
  profile: TikTokProfile
  onOpen: () => void
}) {
  const caption = cleanCaption(video.caption)
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Play video: ${caption || 'TikTok video'}`}
      className={cn(
        cardWidth,
        'group relative aspect-9/16 overflow-hidden rounded-xl bg-stone-200 text-left transition-transform duration-300 active:scale-[0.99]',
      )}
    >
      <img
        src={video.coverUrl}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/35"
      />

      <span className="absolute inset-x-0 top-0 flex items-center gap-2.5 p-4">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="size-8 rounded-full object-cover ring-2 ring-white/70"
          />
        ) : null}
        <span className="truncate text-sm font-semibold text-white">
          {profile.username}
        </span>
        {isLatest ? (
          <span className="ml-auto rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-ink">
            Latest
          </span>
        ) : null}
      </span>

      <span className="absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white opacity-90 ring-1 ring-white/30 backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:bg-white/30 sm:opacity-0 sm:group-hover:opacity-100">
        <HugeiconsIcon icon={PlayIcon} className="size-7 translate-x-px" />
      </span>

      <span className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
        {caption ? (
          <span className="line-clamp-2 type-body font-medium text-white">
            {caption}
          </span>
        ) : null}
        <span className="mt-2 flex items-center gap-1.5 text-sm text-white/75 tabular-nums">
          <HugeiconsIcon icon={PlayIcon} className="size-3.5" />
          {compact.format(video.playCount)}
          <span aria-hidden>·</span>
          {timeAgo(video.postedAt)}
        </span>
      </span>
    </button>
  )
}

function RailSkeleton() {
  return (
    <div className={railClass} role="status" aria-label="Loading videos">
      {Array.from({ length: 6 }, (_, i) => (
        <span
          key={i}
          className={cn(
            cardWidth,
            'aspect-9/16 animate-pulse rounded-xl bg-stone-200',
          )}
          style={{ animationDelay: `${i * 90}ms` }}
        />
      ))}
    </div>
  )
}

/**
 * Full-screen viewer using TikTok's official embed player. Arrow keys and the
 * prev/next buttons move through the reels.
 */
function ReelViewer({
  videos,
  index,
  onIndexChange,
}: {
  videos: TikTokVideo[]
  index: number | null
  onIndexChange: (i: number | null) => void
}) {
  const video = index != null ? videos[index] : undefined
  const hasPrev = index != null && index > 0
  const hasNext = index != null && index < videos.length - 1
  const go = (delta: number) => {
    if (index != null) onIndexChange(index + delta)
  }

  useEffect(() => {
    if (index == null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && index > 0) onIndexChange(index - 1)
      if (e.key === 'ArrowRight' && index < videos.length - 1)
        onIndexChange(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, videos.length, onIndexChange])

  const playerSrc = video
    ? `https://www.tiktok.com/player/v1/${video.id}?` +
      new URLSearchParams({
        autoplay: '1',
        loop: '1',
        music_info: '0',
        description: '0',
        rel: '0',
        native_context_menu: '0',
      }).toString()
    : ''

  return (
    <DialogPrimitive.Root
      open={index != null}
      onOpenChange={(open) => {
        if (!open) onIndexChange(null)
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-md duration-200 data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0" />
        <DialogPrimitive.Popup
          className="fixed inset-0 z-50 flex flex-col items-center justify-center outline-none duration-300 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) onIndexChange(null)
          }}
        >
          <DialogPrimitive.Title className="sr-only">
            TikTok video
          </DialogPrimitive.Title>

          {/* Top bar */}
          <div
            className="flex w-full max-w-md shrink-0 items-center justify-between px-4 pb-3 text-white sm:absolute sm:top-4 sm:right-4 sm:w-auto sm:max-w-none sm:p-0"
            style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
          >
            <span className="text-sm text-white/70 tabular-nums sm:hidden">
              {index != null ? index + 1 : 0} / {videos.length}
            </span>
            <DialogPrimitive.Close
              aria-label="Close"
              className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 transition-colors hover:bg-white/20"
            >
              <HugeiconsIcon icon={CloseIcon} className="size-5" />
            </DialogPrimitive.Close>
          </div>

          <div className="flex min-h-0 w-full flex-1 items-center justify-center gap-4 sm:flex-none">
            <ViewerArrow
              side="left"
              disabled={!hasPrev}
              onClick={() => go(-1)}
            />

            <div className="relative h-full w-full overflow-hidden bg-black sm:aspect-9/16 sm:h-[min(80dvh,820px)] sm:w-auto sm:rounded-2xl sm:shadow-2xl sm:ring-1 sm:ring-white/10">
              {video ? (
                <iframe
                  key={video.id}
                  src={playerSrc}
                  title={cleanCaption(video.caption) || 'TikTok video'}
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 size-full border-0"
                />
              ) : null}
            </div>

            <ViewerArrow
              side="right"
              disabled={!hasNext}
              onClick={() => go(1)}
            />
          </div>

          {/* Caption + actions */}
          {video ? (
            <div
              className="flex w-full max-w-md shrink-0 items-center gap-3 px-4 pt-3 text-white sm:px-0 sm:pt-4"
              style={{
                paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
              }}
            >
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm leading-snug">
                  {cleanCaption(video.caption)}
                </p>
                <p className="mt-0.5 text-xs text-white/60 tabular-nums">
                  {compact.format(video.playCount)} views ·{' '}
                  {timeAgo(video.postedAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 sm:hidden">
                <ViewerArrow
                  side="left"
                  small
                  disabled={!hasPrev}
                  onClick={() => go(-1)}
                />
                <ViewerArrow
                  side="right"
                  small
                  disabled={!hasNext}
                  onClick={() => go(1)}
                />
              </div>
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold text-neutral-950 transition-colors hover:bg-white/90 sm:inline-flex"
              >
                <HugeiconsIcon icon={TiktokIcon} className="size-4" />
                Open in TikTok
              </a>
            </div>
          ) : null}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function ViewerArrow({
  side,
  disabled,
  onClick,
  small = false,
}: {
  side: 'left' | 'right'
  disabled: boolean
  onClick: () => void
  small?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === 'left' ? 'Previous video' : 'Next video'}
      className={cn(
        'items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 transition-all hover:bg-white/20 disabled:pointer-events-none disabled:opacity-30',
        small ? 'flex size-10' : 'hidden size-12 shrink-0 sm:flex',
      )}
    >
      <HugeiconsIcon
        icon={side === 'left' ? BackIcon : ChevronRightIcon}
        className="size-5"
      />
    </button>
  )
}

const EMBED_SCRIPT = 'https://www.tiktok.com/embed.js'

/**
 * Fallback: TikTok's official creator widget, used when the feed can't be
 * read. Its script only scans the page once per load, so a fresh tag is
 * injected each time this mounts.
 */
function OfficialEmbed({
  handle,
  profileUrl,
}: {
  handle: string
  profileUrl: string
}) {
  const embedRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const host = embedRef.current
    if (!host) return

    // Built outside React: embed.js swaps this blockquote for an iframe, and
    // React never reconciles children it didn't render.
    const quote = document.createElement('blockquote')
    quote.className = 'tiktok-embed'
    quote.cite = profileUrl
    quote.dataset.uniqueId = handle
    quote.dataset.embedType = 'creator'
    quote.style.maxWidth = '780px'
    quote.style.minWidth = '288px'
    quote.style.margin = '0 auto'
    const fallback = document.createElement('section')
    const link = document.createElement('a')
    link.href = `${profileUrl}?refer=creator_embed`
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.textContent = `@${handle}`
    fallback.appendChild(link)
    quote.appendChild(fallback)
    host.replaceChildren(quote)

    const mo = new MutationObserver(() => {
      if (host.querySelector('iframe')) {
        setReady(true)
        mo.disconnect()
      }
    })
    mo.observe(host, { childList: true, subtree: true })

    document
      .querySelectorAll(`script[src="${EMBED_SCRIPT}"]`)
      .forEach((s) => s.remove())
    const script = document.createElement('script')
    script.src = EMBED_SCRIPT
    script.async = true
    document.body.appendChild(script)

    // Blocked by a privacy extension or offline — offer a plain link instead
    // of an endless skeleton.
    const timeout = window.setTimeout(() => {
      if (!host.querySelector('iframe')) setFailed(true)
    }, 10_000)

    return () => {
      window.clearTimeout(timeout)
      mo.disconnect()
      host.replaceChildren()
      setReady(false)
    }
  }, [handle, profileUrl])

  return (
    <div className="relative mx-auto max-w-195">
      {failed && !ready ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-black/5">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-neutral-950 text-white">
            <HugeiconsIcon icon={TiktokIcon} className="size-7" />
          </span>
          <p className="text-base font-semibold text-foreground">
            Watch our latest videos on TikTok
          </p>
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            Open @{handle}
          </a>
        </div>
      ) : !ready ? (
        <RailSkeleton />
      ) : null}
      <div
        ref={embedRef}
        className={
          ready
            ? 'animate-in duration-500 fade-in'
            : 'pointer-events-none absolute inset-0 opacity-0'
        }
      />
    </div>
  )
}
