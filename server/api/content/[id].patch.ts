import { prismaClient } from '../../utils/prisma'
import { assertWorkspaceRole, requireSessionUserId } from '../../utils/authz'
import { publishQueue } from '../../plugins/queue'

export default eventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  const body = await readBody<{ title?: string; body?: string; aiPrompt?: string; status?: string; scheduledAt?: string | null }>(event)

  const existing = await prismaClient.content.findUnique({ where: { id }, select: { workspaceId: true } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  await assertWorkspaceRole(event, existing.workspaceId, 'EDITOR')
  const userId = await requireSessionUserId(event)

  let didSchedule = false
  await prismaClient.$transaction(async (tx) => {
    // If scheduling, validate assets
    if (body.status === 'SCHEDULED') {
      const links = await tx.contentAsset.findMany({
        where: { contentId: id },
        select: { role: true, alt: true, asset: { select: { mimeType: true, key: true } } }
      })
      const hasMain = links.some(l => l.role === 'main')
      const missingAlt = links.some(l => /^image\//.test(l.asset.mimeType || '') && (!l.alt || !l.alt.trim()))
      const errors: string[] = []
      if (!hasMain) errors.push('At least one media with role=main is required')
      if (missingAlt) errors.push('Alt text is required for all images')
      if (errors.length) {
        throw createError({ statusCode: 400, statusMessage: errors.join('; ') })
      }
    }

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
      if (body.status === 'SCHEDULED' || body.scheduledAt !== undefined) didSchedule = true
    }
    if (body.body !== undefined || body.aiPrompt !== undefined) {
      const last = await tx.contentVersion.findFirst({ where: { contentId: id }, orderBy: { version: 'desc' }, select: { version: true } })
      const nextVersion = (last?.version ?? 0) + 1
      await tx.contentVersion.create({ data: { contentId: id, version: nextVersion, body: body.body ?? '', aiPrompt: body.aiPrompt ?? null } })
    }
  })

  // Auto-enqueue if now scheduled
  if (didSchedule) {
    const c = await prismaClient.content.findUnique({ where: { id }, select: { status: true, scheduledAt: true } })
    if (c?.status === 'SCHEDULED' && c.scheduledAt) {
      const delay = Math.max(0, new Date(c.scheduledAt).getTime() - Date.now())
      const jobId = `publishContent:${id}`
      const existing = await publishQueue.getJob(jobId)
      if (!existing) {
        await publishQueue.add('publishContent', { contentId: id }, { delay, attempts: 3, backoff: { type: 'exponential', delay: 30000 }, jobId } as any)
      }
    }
  }

  return { ok: true }
})


