import { prismaClient } from '../../../../utils/prisma'
import { assertWorkspaceRole } from '../../../../utils/authz'

export default eventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  const linkId = getRouterParam(event, 'linkId') as string
  if (!id || !linkId) throw createError({ statusCode: 400, statusMessage: 'Missing id/linkId' })

  const content = await prismaClient.content.findUnique({ where: { id }, select: { workspaceId: true } })
  if (!content) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  await assertWorkspaceRole(event, content.workspaceId, 'EDITOR')

  await prismaClient.contentAsset.delete({ where: { id: linkId } })
  return { ok: true }
})


