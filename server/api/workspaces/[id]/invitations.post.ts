import { prismaClient } from '../../../utils/prisma'
import { assertWorkspaceRole } from '../../../utils/authz'
import { randomUUID } from 'node:crypto'
import { sendEmail } from '../../../utils/email'

export default eventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  const body = await readBody<{ email: string; role?: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER' }>(event)
  if (!id || !body?.email) throw createError({ statusCode: 400, statusMessage: 'Missing id or email' })
  await assertWorkspaceRole(event, id, 'ADMIN')

  const token = randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const role = body.role ?? 'EDITOR'

  // Upsert by workspaceId+email if there is an unaccepted invite
  const existing = await prismaClient.invitation.findFirst({ where: { workspaceId: id, email: body.email, acceptedAt: null } })
  const inv = existing
    ? await prismaClient.invitation.update({ where: { id: existing.id }, data: { token, role, expiresAt } })
    : await prismaClient.invitation.create({ data: { workspaceId: id, email: body.email, role, token, expiresAt } })

  const baseUrl = getRequestURL(event).origin
  const url = `${baseUrl}/auth/invite?token=${encodeURIComponent(inv.token)}`
  // Best-effort email
  try {
    const sent = await sendEmail(body.email, 'Invitation à rejoindre un workspace', `
      <p>Tu as été invité à rejoindre le workspace.</p>
      <p><a href="${url}">Accepter l'invitation</a></p>
      <p>Ce lien expire le ${inv.expiresAt.toLocaleString()}.</p>
    `)
    return { token: inv.token, url, expiresAt: inv.expiresAt, emailed: sent }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('send invite email failed', (e as any)?.message || e)
    return { token: inv.token, url, expiresAt: inv.expiresAt, emailed: false }
  }
})


