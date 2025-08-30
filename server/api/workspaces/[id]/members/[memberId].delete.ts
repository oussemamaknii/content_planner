import { prismaClient } from '../../../../utils/prisma'
import { assertWorkspaceRole } from '../../../../utils/authz'

export default eventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  const memberId = getRouterParam(event, 'memberId') as string
  if (!id || !memberId) throw createError({ statusCode: 400, statusMessage: 'Missing params' })
  await assertWorkspaceRole(event, id, 'ADMIN')

  await prismaClient.membership.delete({ where: { id: memberId } })
  return { ok: true }
})


