import { prismaClient } from '../utils/prisma'
import { assertWorkspaceRole } from '../utils/authz'

export default eventHandler(async (event) => {
  const workspaceId = event.context.workspaceId as string | undefined
  if (!workspaceId) throw createError({ statusCode: 400, statusMessage: 'No workspace' })
  await assertWorkspaceRole(event, workspaceId, 'VIEWER')

  const q = getQuery(event)
  const start = q.start ? new Date(String(q.start)) : new Date()
  const end = q.end ? new Date(String(q.end)) : new Date(start.getTime() + 7 * 86400000)

  const items = await prismaClient.schedule.findMany({
    where: { scheduledFor: { gte: start, lt: end }, content: { workspaceId } },
    orderBy: { scheduledFor: 'asc' },
    select: {
      id: true,
      scheduledFor: true,
      status: true,
      content: { select: { id: true, title: true, status: true } },
      channel: { select: { id: true, type: true, name: true } }
    }
  })

  // Also include Content items with scheduledAt in range that have no schedule rows
  const contentOnly = await prismaClient.content.findMany({
    where: { workspaceId, status: 'SCHEDULED', scheduledAt: { gte: start, lt: end } },
    select: { id: true, title: true, status: true, scheduledAt: true }
  })

  // Merge: represent content-only as pseudo items with channel=null
  const merged = [
    ...items,
    ...contentOnly.map((c) => ({
      id: `content:${c.id}`,
      scheduledFor: c.scheduledAt!,
      status: c.status,
      content: { id: c.id, title: c.title, status: c.status },
      channel: null as any
    }))
  ]

  return { items: merged }
})


