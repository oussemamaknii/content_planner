import { assertWorkspaceRole } from '../../../utils/authz'
import { randomUUID } from 'node:crypto'

export default eventHandler(async (event) => {
  const workspaceId = event.context.workspaceId as string | undefined
  if (!workspaceId) throw createError({ statusCode: 400, statusMessage: 'No workspace' })
  await assertWorkspaceRole(event, workspaceId, 'ADMIN')

  const clientId = process.env.LINKEDIN_CLIENT_ID
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI
  if (!clientId || !redirectUri) {
    throw createError({ statusCode: 500, statusMessage: 'LinkedIn OAuth env missing' })
  }

  const state = randomUUID()
  // Bind state to workspace
  setCookie(event, 'li_oauth_state', JSON.stringify({ s: state, w: workspaceId }), { httpOnly: true, sameSite: 'lax', path: '/' })

  const rawScope = process.env.LINKEDIN_SCOPE || 'r_liteprofile'
  const scope = encodeURIComponent(rawScope)
  const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${encodeURIComponent(state)}`
  return sendRedirect(event, url)
})


