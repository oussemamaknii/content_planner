import { prismaClient } from '../../utils/prisma'
import { assertWorkspaceRole } from '../../utils/authz'

export default eventHandler(async (event) => {
  const workspaceId = event.context.workspaceId as string | undefined
  if (!workspaceId) throw createError({ statusCode: 400, statusMessage: 'No workspace in context' })
  await assertWorkspaceRole(event, workspaceId, 'VIEWER')

  const q = getQuery(event)
  const status = q.status as string | undefined
  const take = Math.min(Number(q.take ?? 20), 100)
  const skip = Math.max(Number(q.skip ?? 0), 0)

  const where: any = { workspaceId }
  if (status) where.status = status

  const [items, total] = await Promise.all([
    prismaClient.content.findMany({
      where,
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
      skip,
      take,
      select: { id: true, title: true, status: true, scheduledAt: true, publishedAt: true, createdAt: true, updatedAt: true }
    }),
    prismaClient.content.count({ where })
  ])

  return { items, total }
})


