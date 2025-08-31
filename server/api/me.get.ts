import { prismaClient } from '../utils/prisma'
import { requireSessionUserId } from '../utils/authz'

export default eventHandler(async (event) => {
  const userId = await requireSessionUserId(event)
  const user = await prismaClient.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, image: true, createdAt: true } })
  return { user }
})


