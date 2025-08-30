import { prismaClient } from '../../utils/prisma'
import { assertWorkspaceRole, requireSessionUserId } from '../../utils/authz'

export default eventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  const body = await readBody<{ title?: string; body?: string; aiPrompt?: string; status?: string; scheduledAt?: string | null }>(event)

  const existing = await prismaClient.content.findUnique({ where: { id }, select: { workspaceId: true } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  await assertWorkspaceRole(event, existing.workspaceId, 'EDITOR')
  const userId = await requireSessionUserId(event)

  await prismaClient.$transaction(async (tx) => {
    if (body.title !== undefined || body.status !== undefined || body.scheduledAt !== undefined) {
      await tx.content.update({
        where: { id },
        data: {
          title: body.title ?? undefined,
          status: body.status as any ?? undefined,
          scheduledAt: body.scheduledAt === null ? null : body.scheduledAt ? new Date(body.scheduledAt) : undefined,
          updatedById: userId
        }
      })
    }
    if (body.body !== undefined || body.aiPrompt !== undefined) {
      const last = await tx.contentVersion.findFirst({ where: { contentId: id }, orderBy: { version: 'desc' }, select: { version: true } })
      const nextVersion = (last?.version ?? 0) + 1
      await tx.contentVersion.create({ data: { contentId: id, version: nextVersion, body: body.body ?? '', aiPrompt: body.aiPrompt ?? null } })
    }
  })

  return { ok: true }
})


