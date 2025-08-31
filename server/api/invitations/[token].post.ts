import { prismaClient } from '../../utils/prisma'
import { requireSessionUserId } from '../../utils/authz'

export default eventHandler(async (event) => {
  const token = getRouterParam(event, 'token') as string
  if (!token) throw createError({ statusCode: 400, statusMessage: 'Missing token' })
  const inv = await prismaClient.invitation.findUnique({ where: { token } })
  if (!inv) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  if (inv.acceptedAt) throw createError({ statusCode: 400, statusMessage: 'Already accepted' })
  if (inv.expiresAt.getTime() < Date.now()) throw createError({ statusCode: 400, statusMessage: 'Expired' })

  const userId = await requireSessionUserId(event)
  await prismaClient.$transaction(async (tx) => {
    await tx.membership.upsert({
      where: { userId_workspaceId: { userId, workspaceId: inv.workspaceId } },
      update: { role: inv.role },
      create: { userId, workspaceId: inv.workspaceId, role: inv.role }
    })
    await tx.invitation.update({ where: { id: inv.id }, data: { acceptedAt: new Date() } })
  })
  return { ok: true }
})


