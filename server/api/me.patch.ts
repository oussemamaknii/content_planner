import { prismaClient } from '../utils/prisma'
import { requireSessionUserId } from '../utils/authz'

export default eventHandler(async (event) => {
  const userId = await requireSessionUserId(event)
  const body = await readBody<{ name?: string; image?: string | null }>(event)
  await prismaClient.user.update({ where: { id: userId }, data: { name: body?.name ?? undefined, image: body?.image === undefined ? undefined : body.image } })
  return { ok: true }
})


