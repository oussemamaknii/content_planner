import { prismaClient } from '../../../../utils/prisma'
import { assertWorkspaceRole } from '../../../../utils/authz'

export default eventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  const memberId = getRouterParam(event, 'memberId') as string
  const body = await readBody<{ role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER' }>(event)
  if (!id || !memberId || !body?.role) throw createError({ statusCode: 400, statusMessage: 'Missing params' })
  await assertWorkspaceRole(event, id, 'ADMIN')

  const m = await prismaClient.membership.update({ where: { id: memberId }, data: { role: body.role } })
  return { id: m.id, role: m.role }
})


