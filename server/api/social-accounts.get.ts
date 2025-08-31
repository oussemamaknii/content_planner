import { prismaClient } from '../utils/prisma'
import { assertWorkspaceRole } from '../utils/authz'

export default eventHandler(async (event) => {
  const workspaceId = event.context.workspaceId as string | undefined
  if (!workspaceId) throw createError({ statusCode: 400, statusMessage: 'No workspace' })
  await assertWorkspaceRole(event, workspaceId, 'VIEWER')

  const rows = await prismaClient.socialAccount.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, provider: true, providerUserId: true, name: true, expiresAt: true, createdAt: true }
  })
  return { accounts: rows }
})


