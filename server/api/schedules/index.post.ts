import { prismaClient } from '../../utils/prisma'
import { assertWorkspaceRole } from '../../utils/authz'

export default eventHandler(async (event) => {
  const body = await readBody<{ contentId: string; channelId: string; scheduledFor: string }>(event)
  if (!body?.contentId || !body?.channelId || !body?.scheduledFor) throw createError({ statusCode: 400, statusMessage: 'Missing fields' })

  const content = await prismaClient.content.findUnique({ where: { id: body.contentId }, select: { workspaceId: true } })
  if (!content) throw createError({ statusCode: 404, statusMessage: 'Content not found' })
  await assertWorkspaceRole(event, content.workspaceId, 'EDITOR')

  const schedule = await prismaClient.schedule.create({
    data: { contentId: body.contentId, channelId: body.channelId, scheduledFor: new Date(body.scheduledFor) }
  })
  return { id: schedule.id }
})


