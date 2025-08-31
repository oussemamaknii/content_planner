import { assertWorkspaceRole } from '../../../utils/authz'
import { publishQueue } from '../../../plugins/queue'
import { prismaClient } from '../../../utils/prisma'

export default eventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  const sched = await prismaClient.schedule.findUnique({ where: { id }, select: { content: { select: { workspaceId: true } }, scheduledFor: true, status: true } })
  if (!sched) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  await assertWorkspaceRole(event, sched.content.workspaceId, 'EDITOR')

  const delay = Math.max(0, new Date(sched.scheduledFor).getTime() - Date.now())
  const opts = { delay, attempts: 3, backoff: { type: 'exponential', delay: 30000 } }
  await publishQueue.add('publish', { scheduleId: id }, opts as any)
  return { enqueued: true, delayMs: delay }
})


