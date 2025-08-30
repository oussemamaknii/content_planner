import { getServerSession } from '#auth'
import { prismaClient } from './prisma'

export type Role = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER'

const roleRank: Record<Role, number> = {
  OWNER: 4,
  ADMIN: 3,
  EDITOR: 2,
  VIEWER: 1
}

export async function requireSessionUserId(event: any): Promise<string> {
  const session = await getServerSession(event)
  const email = session?.user?.email
  if (!email) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const user = await prismaClient.user.findUnique({ where: { email: String(email) }, select: { id: true } })
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  return user.id
}

export async function assertWorkspaceRole(event: any, workspaceId: string, minRole: Role = 'VIEWER') {
  const userId = await requireSessionUserId(event)
  const membership = await prismaClient.membership.findFirst({ where: { userId, workspaceId }, select: { role: true } })
  if (!membership) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  if (roleRank[membership.role as Role] < roleRank[minRole]) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
}


