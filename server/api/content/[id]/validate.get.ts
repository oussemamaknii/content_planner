import { prismaClient } from '../../../utils/prisma'
import { assertWorkspaceRole } from '../../../utils/authz'
import { validateAssetsForChannel } from '../../../utils/constraints'

export default eventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const content = await prismaClient.content.findUnique({
    where: { id },
    select: { workspaceId: true, schedules: { select: { channel: { select: { type: true } } } } }
  })
  if (!content) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  await assertWorkspaceRole(event, content.workspaceId, 'VIEWER')

  const links = await prismaClient.contentAsset.findMany({
    where: { contentId: id },
    select: { asset: { select: { mimeType: true, width: true, height: true, durationSeconds: true } } }
  })
  const metas = links.map(l => ({
    mimeType: l.asset.mimeType,
    width: l.asset.width,
    height: l.asset.height,
    durationSeconds: l.asset.durationSeconds
  }))

  // If no schedules yet, validate across all channel types to guide the user
  const channelTypes = content.schedules.length
    ? content.schedules.map(s => s.channel.type)
    : (['TWITTER','LINKEDIN','INSTAGRAM','FACEBOOK','TIKTOK','YOUTUBE'] as any[])

  const result = channelTypes.map((type) => ({
    type,
    ...validateAssetsForChannel(type as any, metas)
  }))

  return { result }
})


