import { prismaClient } from '../../utils/prisma'
import { assertWorkspaceRole } from '../../utils/authz'

export default eventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const existing = await prismaClient.content.findUnique({ where: { id }, select: { workspaceId: true } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  await assertWorkspaceRole(event, existing.workspaceId, 'ADMIN')

  await prismaClient.content.delete({ where: { id } })
  return { ok: true }
})


