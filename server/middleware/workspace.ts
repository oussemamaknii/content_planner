import { getServerSession } from '#auth'
import { prismaClient } from '../utils/prisma'

export default defineEventHandler(async (event) => {
  // 1) Prefer query param `w`
  const queryW = getQuery(event).w as string | undefined
  if (queryW) {
    event.context.workspaceId = queryW
    return
  } else {
    // 2) Then cookie `cw`
    const cookieW = getCookie(event, 'cw')
    if (cookieW) {
      event.context.workspaceId = cookieW
      return
    }
  }

  const session = await getServerSession(event)
  if (!session?.user?.email) return

  // current workspace from session callback
  const workspaceId = (session as any).workspaceId as string | undefined
  if (workspaceId) {
    event.context.workspaceId = workspaceId
    return
  }

  // fallback: pick first membership
  const user = await prismaClient.user.findUnique({
    where: { email: String(session.user.email) },
    select: { id: true, memberships: { select: { workspaceId: true }, take: 1 } }
  })
  if (user?.memberships[0]?.workspaceId) {
    event.context.workspaceId = user.memberships[0].workspaceId
  }
})


