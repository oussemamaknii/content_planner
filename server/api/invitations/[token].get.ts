import { prismaClient } from '../../utils/prisma'

export default eventHandler(async (event) => {
  const token = getRouterParam(event, 'token') as string
  if (!token) throw createError({ statusCode: 400, statusMessage: 'Missing token' })
  const inv = await prismaClient.invitation.findUnique({ where: { token } })
  if (!inv) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  if (inv.acceptedAt) throw createError({ statusCode: 400, statusMessage: 'Already accepted' })
  if (inv.expiresAt.getTime() < Date.now()) throw createError({ statusCode: 400, statusMessage: 'Expired' })
  return { workspaceId: inv.workspaceId, email: inv.email, role: inv.role, expiresAt: inv.expiresAt }
})


