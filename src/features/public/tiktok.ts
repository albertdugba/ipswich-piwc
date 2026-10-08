import { createServerFn } from '@tanstack/react-start'

/**
 * Latest videos for a TikTok account, for the custom reels section.
 *
 * Source: the public data behind TikTok's own creator embed
 * (tiktok.com/embed/@handle) — the same feed their official widget renders.
 * It isn't a documented API, so it can change without notice: every failure
 * resolves to `null` and the UI falls back to the official embed widget.
 */

export interface TikTokVideo {
  id: string
  caption: string
  coverUrl: string
  playCount: number
  /** ISO timestamp, decoded from the video id. */
  postedAt: string
  url: string
}

export interface TikTokProfile {
  username: string
  nickname: string
  avatarUrl: string | null
  bio: string
  followerCount: number
  likeCount: number
  url: string
}

export interface TikTokFeedData {
  profile: TikTokProfile
  videos: TikTokVideo[]
}

const USERNAME_RE = /^[A-Za-z0-9._]{2,24}$/
// Cover URLs are signed and expire after ~2 days; refresh well inside that.
const TTL_MS = 30 * 60 * 1000
const cache = new Map<string, { at: number; data: TikTokFeedData }>()

/** TikTok ids carry the post time (unix seconds) in their top 32 bits. */
function postedAtFromId(id: string): string {
  try {
    return new Date(Number(BigInt(id) >> 32n) * 1000).toISOString()
  } catch {
    return new Date(0).toISOString()
  }
}

type RawVideo = {
  id?: string
  desc?: string
  coverUrl?: string
  originCoverUrl?: string
  playCount?: number
  privateItem?: boolean
}

type RawUser = {
  uniqueId?: string
  nickname?: string
  avatarThumbUrl?: string
  avatarMediumUrl?: string
  signature?: string
  followerCount?: number
  heartCount?: number
}

type RawEmbedPage = { videoList?: RawVideo[]; userInfo?: RawUser }

function parseEmbedPage(html: string, username: string): TikTokFeedData | null {
  const match = html.match(
    /<script id="__FRONTITY_CONNECT_STATE__"[^>]*>([\s\S]*?)<\/script>/,
  )
  if (!match?.[1]) return null
  const state = JSON.parse(match[1]) as {
    source?: { data?: Record<string, RawEmbedPage> }
  }
  const page = Object.values(state.source?.data ?? {}).find((p) =>
    Array.isArray(p.videoList),
  )
  if (!page?.videoList) return null

  const profileUrl = `https://www.tiktok.com/@${username}`
  const user = page.userInfo ?? {}

  const videos = page.videoList
    .filter((v): v is RawVideo & { id: string } =>
      Boolean(v.id && !v.privateItem),
    )
    .map((v) => ({
      id: v.id,
      caption: (v.desc ?? '').trim(),
      coverUrl: v.originCoverUrl || v.coverUrl || '',
      playCount: v.playCount ?? 0,
      postedAt: postedAtFromId(v.id),
      url: `${profileUrl}/video/${v.id}`,
    }))
    .filter((v) => v.coverUrl)
    // The embed lists pinned videos first; the section shows newest first.
    .sort((a, b) => b.postedAt.localeCompare(a.postedAt))

  return {
    profile: {
      username: user.uniqueId ?? username,
      nickname: user.nickname ?? username,
      avatarUrl: user.avatarMediumUrl ?? user.avatarThumbUrl ?? null,
      bio: user.signature ?? '',
      followerCount: user.followerCount ?? 0,
      likeCount: user.heartCount ?? 0,
      url: profileUrl,
    },
    videos,
  }
}

export const getTikTokFeed = createServerFn({ method: 'GET' })
  .inputValidator((username: string) => {
    const handle = username.replace(/^@/, '')
    if (!USERNAME_RE.test(handle)) throw new Error('Invalid TikTok username')
    return handle
  })
  .handler(async ({ data: username }): Promise<TikTokFeedData | null> => {
    const cached = cache.get(username)
    if (cached && Date.now() - cached.at < TTL_MS) return cached.data

    try {
      const res = await fetch(`https://www.tiktok.com/embed/@${username}`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
          'Accept-Language': 'en-GB,en;q=0.9',
        },
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) throw new Error(`TikTok responded ${res.status}`)
      const data = parseEmbedPage(await res.text(), username)
      if (!data || data.videos.length === 0) throw new Error('No videos found')
      cache.set(username, { at: Date.now(), data })
      return data
    } catch (err) {
      console.warn('[tiktok] feed unavailable:', err)
      // A slightly stale list beats none while TikTok hiccups — but only
      // within a day, since the signed cover URLs expire after ~2.
      const fresh = cached && Date.now() - cached.at < 24 * 60 * 60 * 1000
      return fresh ? cached.data : null
    }
  })
