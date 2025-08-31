import { prismaClient } from '../../utils/prisma'
import { assertWorkspaceRole } from '../../utils/authz'

export default eventHandler(async (event) => {
  const workspaceId = event.context.workspaceId as string | undefined
  if (!workspaceId) throw createError({ statusCode: 400, statusMessage: 'No workspace' })
  await assertWorkspaceRole(event, workspaceId, 'ADMIN')

  const [users, contents, scheduled, assets] = await Promise.all([
    prismaClient.membership.count({ where: { workspaceId } }),
    prismaClient.content.count({ where: { workspaceId } }),
    prismaClient.schedule.count({ where: { content: { workspaceId } } }),
    prismaClient.mediaAsset.count({ where: { workspaceId } })
  ])

  return { users, contents, scheduled, assets }
})



