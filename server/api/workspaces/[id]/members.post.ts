import { prismaClient } from '../../../utils/prisma'
import { assertWorkspaceRole } from '../../../utils/authz'

export default eventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  const body = await readBody<{ email: string; role?: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER' }>(event)
  if (!id || !body?.email) throw createError({ statusCode: 400, statusMessage: 'Missing id or email' })
  await assertWorkspaceRole(event, id, 'ADMIN')

  const user = await prismaClient.user.findUnique({ where: { email: body.email }, select: { id: true } })
  if (!user) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  const role = body.role ?? 'EDITOR'
  const membership = await prismaClient.membership.upsert({
    where: { userId_workspaceId: { userId: user.id, workspaceId: id } },
    update: { role },
    create: { userId: user.id, workspaceId: id, role }
  })
  return { id: membership.id }
})


