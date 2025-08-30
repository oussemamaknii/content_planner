import { prismaClient } from '../../utils/prisma'
import { assertWorkspaceRole, requireSessionUserId } from '../../utils/authz'

export default eventHandler(async (event) => {
  const workspaceId = event.context.workspaceId as string | undefined
  if (!workspaceId) throw createError({ statusCode: 400, statusMessage: 'No workspace in context' })
  await assertWorkspaceRole(event, workspaceId, 'EDITOR')
  const userId = await requireSessionUserId(event)

  const body = await readBody<{ title: string; body?: string; aiPrompt?: string; scheduledAt?: string | null }>(event)
  if (!body?.title) throw createError({ statusCode: 400, statusMessage: 'Missing title' })

  const content = await prismaClient.$transaction(async (tx) => {
    const created = await tx.content.create({
      data: {
        workspaceId,
        title: body.title,
        createdById: userId,
        updatedById: userId,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null
      }
    })
    if (body.body || body.aiPrompt) {
      await tx.contentVersion.create({
        data: { contentId: created.id, version: 1, body: body.body ?? '', aiPrompt: body.aiPrompt ?? null }
      })
    }
    return created
  })

  return { id: content.id }
})


