import { prismaClient } from '../../../utils/prisma'
import { assertWorkspaceRole } from '../../../utils/authz'
import { linkedinPublishText } from '../../../utils/connectors/linkedin'

export default eventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const content = await prismaClient.content.findUnique({
    where: { id },
    select: { id: true, workspaceId: true, versions: { orderBy: { version: 'desc' }, take: 1, select: { body: true } }, title: true }
  })
  if (!content) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  await assertWorkspaceRole(event, content.workspaceId, 'ADMIN')

  // Find a connected LinkedIn account for this workspace
  const sa = await prismaClient.socialAccount.findFirst({ where: { workspaceId: content.workspaceId, provider: 'LINKEDIN' } })
  if (!sa) throw createError({ statusCode: 400, statusMessage: 'No LinkedIn account connected' })

  const text = (content.versions[0]?.body || content.title || '').slice(0, 2800)
  const res = await linkedinPublishText({ accessToken: sa.accessToken, providerUserId: sa.providerUserId }, text)

  await prismaClient.publishLog.create({ data: { workspaceId: content.workspaceId, contentId: content.id, provider: 'LINKEDIN', status: 'SENT', externalId: (res as any)?.id ?? null, payload: res as any } })
  return { ok: true }
})


