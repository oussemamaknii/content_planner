import { prismaClient } from '../../../utils/prisma'
import { assertWorkspaceRole } from '../../../utils/authz'

export default eventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  await assertWorkspaceRole(event, id, 'VIEWER')

  const members = await prismaClient.membership.findMany({
    where: { workspaceId: id },
    select: {
      id: true,
      role: true,
      user: { select: { id: true, name: true, email: true, image: true } }
    },
    orderBy: { createdAt: 'asc' }
  })

  return {
    members: members.map(m => ({
      id: m.id,
      role: m.role,
      user: m.user
    }))
  }
})


