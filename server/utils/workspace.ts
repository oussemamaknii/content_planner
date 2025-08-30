export async function ensureDefaultWorkspaceForUser(prisma: any, userId: string) {
  const membership = await prisma.membership.findFirst({ where: { userId } })
  if (membership) return membership.workspaceId

  // create workspace and membership
  const slugBase = 'mon-espace'
  let slug = slugBase
  let i = 1
  while (await prisma.workspace.findUnique({ where: { slug } })) {
    slug = `${slugBase}-${i++}`
  }
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Mon Espace',
      slug,
      memberships: {
        create: {
          userId,
          role: 'OWNER'
        }
      }
    }
  })
  return workspace.id
}
