import { getServerSession } from '#auth'
import { prismaClient } from '../utils/prisma'

export default eventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session?.user?.email) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const user = await prismaClient.user.findUnique({
    where: { email: String(session.user.email) },
    select: {
      id: true,
      memberships: {
        select: { role: true, workspace: { select: { id: true, name: true, slug: true, createdAt: true } } }
      }
    }
  })

  return {
    workspaces: (user?.memberships ?? []).map(m => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      role: m.role,
      createdAt: m.workspace.createdAt
    }))
  }
})


