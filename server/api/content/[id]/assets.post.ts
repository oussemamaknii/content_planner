import { prismaClient } from '../../../utils/prisma'
import { assertWorkspaceRole, requireSessionUserId } from '../../../utils/authz'

export default eventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  const userId = await requireSessionUserId(event)

  const content = await prismaClient.content.findUnique({ where: { id }, select: { workspaceId: true } })
  if (!content) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  await assertWorkspaceRole(event, content.workspaceId, 'EDITOR')

  const body = await readBody<{ assetIds?: string[]; keys?: string[]; role?: string }>(event)
  const role = body?.role ?? 'secondary'

  let assetIds: string[] = []
  if (Array.isArray(body?.assetIds) && body!.assetIds.length) {
    assetIds = body!.assetIds
  } else if (Array.isArray(body?.keys) && body!.keys.length) {
    // Upsert MediaAsset for each key in current workspace
    const keys = body!.keys
    const bucket = process.env.SUPABASE_BUCKET ?? 'media'
    const created = await prismaClient.$transaction(async (tx) => {
      const ids: string[] = []
      for (const key of keys) {
        // Ensure key belongs to this workspace
        const wsPrefix = `${content.workspaceId}/`
        if (!key.startsWith(wsPrefix)) {
          throw createError({ statusCode: 400, statusMessage: 'Key not in workspace' })
        }
        const lower = key.toLowerCase()
        const mime = lower.endsWith('.png') ? 'image/png'
          : lower.endsWith('.jpg') || lower.endsWith('.jpeg') ? 'image/jpeg'
          : lower.endsWith('.webp') ? 'image/webp'
          : lower.endsWith('.gif') ? 'image/gif'
          : lower.endsWith('.svg') ? 'image/svg+xml'
          : 'application/octet-stream'
        const asset = await tx.mediaAsset.upsert({
          where: { workspaceId_key: { workspaceId: content.workspaceId, key } },
          update: {},
          create: {
            workspaceId: content.workspaceId,
            key,
            url: `supabase://${bucket}/${key}`,
            mimeType: mime,
            createdById: userId
          }
        })
        ids.push(asset.id)
      }
      return ids
    })
    assetIds = created
  }
  if (!assetIds.length) throw createError({ statusCode: 400, statusMessage: 'No assetIds or keys' })

  // Determine current max order
  const currentMax = await prismaClient.contentAsset.aggregate({ _max: { order: true }, where: { contentId: id } })
  let nextOrder = (currentMax._max.order ?? -1) + 1

  const created = await prismaClient.$transaction(async (tx) => {
    const links = [] as { id: string }[]
    for (const assetId of assetIds) {
      const link = await tx.contentAsset.create({
        data: { contentId: id, assetId, role, order: nextOrder++ }
      })
      links.push({ id: link.id })
    }
    return links
  })

  return { links: created }
})


