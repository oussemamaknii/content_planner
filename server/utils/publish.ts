import { prismaClient } from './prisma'
import { getSupabaseServerClient } from './supabase'
import { linkedinPublishText, linkedinRegisterImageUpload, linkedinUploadBinaryToUrl, linkedinPublishImage } from './connectors/linkedin'

export async function publishSchedule(scheduleId: string): Promise<{ provider: string; externalId?: string | null }> {
  const schedule = await prismaClient.schedule.findUnique({
    where: { id: scheduleId },
    select: {
      id: true,
      status: true,
      scheduledFor: true,
      content: {
        select: {
          id: true,
          workspaceId: true,
          title: true,
          versions: { orderBy: { version: 'desc' }, take: 1, select: { body: true } }
        }
      },
      channel: { select: { id: true, type: true } }
    }
  })
  if (!schedule) throw new Error('Schedule not found')

  const workspaceId = schedule.content.workspaceId
  const text = (schedule.content.versions[0]?.body || schedule.content.title || '').slice(0, 2800)

  // Currently support only LinkedIn
  if (schedule.channel.type !== 'LINKEDIN') {
    await prismaClient.publishLog.create({ data: { workspaceId, scheduleId: schedule.id, contentId: schedule.content.id, channelId: schedule.channel.id, provider: String(schedule.channel.type), status: 'SKIPPED', error: 'Unsupported provider' } })
    return { provider: String(schedule.channel.type), externalId: null }
  }

  const sa = await prismaClient.socialAccount.findFirst({ where: { workspaceId, provider: 'LINKEDIN' } })
  if (!sa) throw new Error('No LinkedIn account connected')

  let res: any

  // Try main image
  const link = await prismaClient.contentAsset.findFirst({
    where: { contentId: schedule.content.id, role: 'main', asset: { mimeType: { startsWith: 'image/' } } },
    select: { asset: { select: { key: true, mimeType: true } } }
  })
  if (link) {
    try {
      const supa = getSupabaseServerClient()
      const bucket = process.env.SUPABASE_BUCKET ?? 'media'
      const { data } = await supa.storage.from(bucket).download(link.asset.key)
      if (data) {
        const buf = Buffer.from(await data.arrayBuffer())
        const { asset, uploadUrl } = await linkedinRegisterImageUpload({ accessToken: sa.accessToken, providerUserId: sa.providerUserId }, link.asset.mimeType)
        await linkedinUploadBinaryToUrl(uploadUrl, buf, link.asset.mimeType)
        res = await linkedinPublishImage({ accessToken: sa.accessToken, providerUserId: sa.providerUserId }, text, asset)
      }
    } catch (e: any) {
      // Fallback to text-only
      res = await linkedinPublishText({ accessToken: sa.accessToken, providerUserId: sa.providerUserId }, text)
    }
  } else {
    res = await linkedinPublishText({ accessToken: sa.accessToken, providerUserId: sa.providerUserId }, text)
  }

  await prismaClient.publishLog.create({ data: { workspaceId, scheduleId: schedule.id, contentId: schedule.content.id, channelId: schedule.channel.id, provider: 'LINKEDIN', status: 'SENT', externalId: (res as any)?.id ?? null, payload: res as any } })
  await prismaClient.schedule.update({ where: { id: schedule.id }, data: { status: 'SENT', externalId: (res as any)?.id ?? null } })
  return { provider: 'LINKEDIN', externalId: (res as any)?.id ?? null }
}

export async function publishContentDefault(contentId: string): Promise<{ provider: string; externalId?: string | null }> {
  const content = await prismaClient.content.findUnique({
    where: { id: contentId },
    select: { id: true, workspaceId: true, title: true, status: true, versions: { orderBy: { version: 'desc' }, take: 1, select: { body: true } } }
  })
  if (!content) throw new Error('Content not found')
  const workspaceId = content.workspaceId
  const text = (content.versions[0]?.body || content.title || '').slice(0, 2800)

  const sa = await prismaClient.socialAccount.findFirst({ where: { workspaceId, provider: 'LINKEDIN' } })
  if (!sa) throw new Error('No LinkedIn account connected')

  let res: any
  const link = await prismaClient.contentAsset.findFirst({
    where: { contentId, role: 'main', asset: { mimeType: { startsWith: 'image/' } } },
    select: { asset: { select: { key: true, mimeType: true } } }
  })
  if (link) {
    try {
      const supa = getSupabaseServerClient()
      const bucket = process.env.SUPABASE_BUCKET ?? 'media'
      const { data } = await supa.storage.from(bucket).download(link.asset.key)
      if (data) {
        const buf = Buffer.from(await data.arrayBuffer())
        const { asset, uploadUrl } = await linkedinRegisterImageUpload({ accessToken: sa.accessToken, providerUserId: sa.providerUserId }, link.asset.mimeType)
        await linkedinUploadBinaryToUrl(uploadUrl, buf, link.asset.mimeType)
        res = await linkedinPublishImage({ accessToken: sa.accessToken, providerUserId: sa.providerUserId }, text, asset)
      }
    } catch (e) {
      res = await linkedinPublishText({ accessToken: sa.accessToken, providerUserId: sa.providerUserId }, text)
    }
  } else {
    res = await linkedinPublishText({ accessToken: sa.accessToken, providerUserId: sa.providerUserId }, text)
  }

  await prismaClient.publishLog.create({ data: { workspaceId, contentId, provider: 'LINKEDIN', status: 'SENT', externalId: (res as any)?.id ?? null, payload: res as any } })
  await prismaClient.content.update({ where: { id: contentId }, data: { status: 'PUBLISHED', publishedAt: new Date() } })
  return { provider: 'LINKEDIN', externalId: (res as any)?.id ?? null }
}


