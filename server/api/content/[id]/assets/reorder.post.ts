import { prismaClient } from '../../../../utils/prisma'
import { assertWorkspaceRole } from '../../../../utils/authz'

export default eventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const content = await prismaClient.content.findUnique({ where: { id }, select: { workspaceId: true } })
  if (!content) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  await assertWorkspaceRole(event, content.workspaceId, 'EDITOR')

  const body = await readBody<{ orders: { linkId: string; order: number }[] }>(event)
  const orders = body?.orders ?? []
  if (!orders.length) return { ok: true }

  await prismaClient.$transaction(async (tx) => {
    for (const it of orders) {
      await tx.contentAsset.update({ where: { id: it.linkId }, data: { order: it.order } })
    }
  })
  return { ok: true }
})


