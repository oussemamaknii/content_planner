import { prismaClient } from '../../../../utils/prisma'
import { assertWorkspaceRole } from '../../../../utils/authz'

export default eventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  const linkId = getRouterParam(event, 'linkId') as string
  if (!id || !linkId) throw createError({ statusCode: 400, statusMessage: 'Missing id/linkId' })

  const content = await prismaClient.content.findUnique({ where: { id }, select: { workspaceId: true } })
  if (!content) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  await assertWorkspaceRole(event, content.workspaceId, 'EDITOR')

  const body = await readBody<{ role?: string; caption?: string | null; alt?: string | null; focalPoint?: unknown }>(event)
  await prismaClient.contentAsset.update({
    where: { id: linkId },
    data: {
      role: body.role ?? undefined,
      caption: body.caption === undefined ? undefined : body.caption,
      alt: body.alt === undefined ? undefined : body.alt,
      focalPoint: body.focalPoint === undefined ? undefined : (body.focalPoint as any)
    }
  })
  return { ok: true }
})


