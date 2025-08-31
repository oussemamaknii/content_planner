import { assertWorkspaceRole } from '../../../utils/authz'
import { prismaClient } from '../../../utils/prisma'
import { publishQueue } from '../../../plugins/queue'

export default eventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  const c = await prismaClient.content.findUnique({ where: { id }, select: { workspaceId: true, scheduledAt: true, status: true } })
  if (!c) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  await assertWorkspaceRole(event, c.workspaceId, 'EDITOR')
  if (c.status !== 'SCHEDULED' || !c.scheduledAt) throw createError({ statusCode: 400, statusMessage: 'Content not SCHEDULED' })

  const delay = Math.max(0, new Date(c.scheduledAt).getTime() - Date.now())
  const jobId = `publishContent:${id}`
  const existing = await publishQueue.getJob(jobId)
  if (!existing) {
    await publishQueue.add('publishContent', { contentId: id }, { delay, attempts: 3, backoff: { type: 'exponential', delay: 30000 }, jobId } as any)
    return { enqueued: true, delayMs: delay, existed: false }
  } else {
    const state = await existing.getState()
    const activeStates = ['waiting', 'delayed', 'active', 'paused', 'waiting-children']
    const stillQueued = activeStates.includes(state)
    return { enqueued: stillQueued, delayMs: delay, existed: true, state }
  }
})


