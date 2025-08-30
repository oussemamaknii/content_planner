import { prismaClient } from '../../utils/prisma'
import { assertWorkspaceRole } from '../../utils/authz'

export default eventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  const body = await readBody<{ name?: string }>(event)
  if (!id || !body?.name) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id or name' })
  }
  await assertWorkspaceRole(event, id, 'ADMIN')

  const slugBase = body.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'workspace'
  let slug = slugBase
  let i = 1
  while (await prismaClient.workspace.findUnique({ where: { slug } })) {
    slug = `${slugBase}-${i++}`
  }
  const ws = await prismaClient.workspace.update({ where: { id }, data: { name: body.name, slug } })
  return { id: ws.id, name: ws.name, slug: ws.slug }
})


