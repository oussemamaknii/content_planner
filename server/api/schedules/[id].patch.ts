import { prismaClient } from '../../utils/prisma'
import { assertWorkspaceRole } from '../../utils/authz'

export default eventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  const body = await readBody<{ scheduledFor?: string }>(event)

  const sched = await prismaClient.schedule.findUnique({ where: { id }, select: { content: { select: { workspaceId: true } } } })
  if (!sched) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  await assertWorkspaceRole(event, sched.content.workspaceId, 'EDITOR')

  await prismaClient.schedule.update({
    where: { id },
    data: { scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined }
  })
  return { ok: true }
})


