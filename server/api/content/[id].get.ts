import { prismaClient } from '../../utils/prisma'
import { assertWorkspaceRole } from '../../utils/authz'

export default eventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const c = await prismaClient.content.findUnique({
    where: { id },
    select: {
      id: true,
      workspaceId: true,
      title: true,
      status: true,
      scheduledAt: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      versions: { orderBy: { version: 'desc' }, take: 1, select: { version: true, body: true, aiPrompt: true } }
    }
  })
  if (!c) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  await assertWorkspaceRole(event, c.workspaceId, 'VIEWER')

  return { ...c, version: c.versions[0] ?? null }
})


