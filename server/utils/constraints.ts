import type { ChannelType } from '@prisma/client'

export type ComplianceLevel = 'ok' | 'warn' | 'error'

export interface ChannelConstraints {
  supportsImages: boolean
  supportsVideos: boolean
  minImageWidth?: number
  minImageHeight?: number
  maxVideoDurationSeconds?: number
}

export function getChannelConstraints(type: ChannelType): ChannelConstraints {
  // Basic MVP constraints, can be refined later per platform
  switch (type) {
    case 'INSTAGRAM':
      return { supportsImages: true, supportsVideos: true, minImageWidth: 1080, minImageHeight: 1080, maxVideoDurationSeconds: 90 }
    case 'TIKTOK':
      return { supportsImages: false, supportsVideos: true, maxVideoDurationSeconds: 600 }
    case 'TWITTER':
      return { supportsImages: true, supportsVideos: true, minImageWidth: 600, minImageHeight: 335, maxVideoDurationSeconds: 140 }
    case 'LINKEDIN':
      return { supportsImages: true, supportsVideos: true, minImageWidth: 552, minImageHeight: 368, maxVideoDurationSeconds: 600 }
    case 'FACEBOOK':
      return { supportsImages: true, supportsVideos: true, minImageWidth: 720, minImageHeight: 720, maxVideoDurationSeconds: 240 }
    case 'YOUTUBE':
      return { supportsImages: false, supportsVideos: true, maxVideoDurationSeconds: 43200 }
    default:
      return { supportsImages: true, supportsVideos: true, minImageWidth: 600, minImageHeight: 600, maxVideoDurationSeconds: 600 }
  }
}

export interface AssetMeta {
  mimeType: string
  width?: number | null
  height?: number | null
  durationSeconds?: number | null
}

export function validateAssetsForChannel(
  type: ChannelType,
  assets: AssetMeta[]
): { level: ComplianceLevel; messages: string[] } {
  const rules = getChannelConstraints(type)
  const messages: string[] = []

  const images = assets.filter(a => /^image\//.test(a.mimeType || ''))
  const videos = assets.filter(a => /^video\//.test(a.mimeType || ''))

  // Determine if at least one asset is acceptable
  let ok = false

  if (rules.supportsImages && images.length) {
    const meets = images.some(a => {
      const w = a.width ?? 0
      const h = a.height ?? 0
      return (!rules.minImageWidth || w >= rules.minImageWidth) && (!rules.minImageHeight || h >= rules.minImageHeight)
    })
    if (meets) ok = true
    else if (images.length) messages.push(`Images below min size (${rules.minImageWidth}x${rules.minImageHeight})`)
  } else if (images.length && !rules.supportsImages) {
    messages.push('Images not supported on this channel')
  }

  if (rules.supportsVideos && videos.length) {
    const meets = videos.some(a => !rules.maxVideoDurationSeconds || (a.durationSeconds ?? Infinity) <= rules.maxVideoDurationSeconds)
    if (meets) ok = true
    else if (videos.length) messages.push(`Videos exceed max duration (${rules.maxVideoDurationSeconds}s)`)
  } else if (videos.length && !rules.supportsVideos) {
    messages.push('Videos not supported on this channel')
  }

  const level: ComplianceLevel = ok ? (messages.length ? 'warn' : 'ok') : 'error'
  if (!messages.length && level !== 'ok') messages.push('No suitable media for this channel')
  return { level, messages }
}


