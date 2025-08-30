import { getServerSession } from '#auth'
import { prismaClient } from '../utils/prisma'

export default eventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session?.user?.email) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const body = await readBody<{ name: string }>(event)
  if (!body?.name) {
    throw createError({ statusCode: 400, statusMessage: 'Missing name' })
  }

  const user = await prismaClient.user.findUnique({ where: { email: String(session.user.email) }, select: { id: true } })
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const slugBase = body.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'workspace'
  let slug = slugBase
  let i = 1
  while (await prismaClient.workspace.findUnique({ where: { slug } })) {
    slug = `${slugBase}-${i++}`
  }

  const workspace = await prismaClient.workspace.create({
    data: {
      name: body.name,
      slug,
      memberships: { create: { userId: user.id, role: 'OWNER' } }
    }
  })

  return { id: workspace.id, name: workspace.name, slug: workspace.slug }
})


