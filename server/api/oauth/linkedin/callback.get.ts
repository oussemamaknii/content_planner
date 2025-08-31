import { prismaClient } from '../../../utils/prisma'

export default eventHandler(async (event) => {
  const q = getQuery(event)
  const err = q.error as string | undefined
  const errDesc = q.error_description as string | undefined
  if (err) {
    // Graceful redirect back to channels with the error message
    const msg = encodeURIComponent(`${err}${errDesc ? ': ' + errDesc : ''}`)
    return sendRedirect(event, `/settings/channels?oauth_error=${msg}`)
  }
  const code = (q.code as string | undefined) ?? ''
  const state = (q.state as string | undefined) ?? ''
  if (!code || !state) throw createError({ statusCode: 400, statusMessage: 'Missing code/state' })

  // Validate state
  const cookie = getCookie(event, 'li_oauth_state')
  if (!cookie) throw createError({ statusCode: 400, statusMessage: 'Invalid state' })
  const parsed = JSON.parse(cookie)
  if (parsed.s !== state) throw createError({ statusCode: 400, statusMessage: 'State mismatch' })
  const workspaceId = parsed.w as string

  const clientId = process.env.LINKEDIN_CLIENT_ID!
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI!

  // Exchange code for token
  const tokenRes = await $fetch<any>('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret
    }).toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })

  const accessToken = tokenRes.access_token as string
  const expiresIn = Number(tokenRes.expires_in || 0)
  const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null

  // Fetch profile (support both OIDC and standard API)
  let providerUserId = ''
  let name = ''
  try {
    // OIDC userinfo when scope contains 'openid'
    const info = await $fetch<any>('https://api.linkedin.com/v2/userinfo', { headers: { Authorization: `Bearer ${accessToken}` } })
    providerUserId = info.sub as string
    name = info.name || ''
  } catch {
    const me = await $fetch<any>('https://api.linkedin.com/v2/me', { headers: { Authorization: `Bearer ${accessToken}` } })
    providerUserId = me.id as string
    name = [me.localizedFirstName, me.localizedLastName].filter(Boolean).join(' ')
  }

  // Save SocialAccount
  await prismaClient.socialAccount.upsert({
    where: { workspaceId_provider_providerUserId: { workspaceId, provider: 'LINKEDIN', providerUserId } },
    update: { accessToken, expiresAt: expiresAt ?? undefined, name },
    create: { workspaceId, provider: 'LINKEDIN', providerUserId, accessToken, expiresAt: expiresAt ?? undefined, name }
  })

  deleteCookie(event, 'li_oauth_state')
  return sendRedirect(event, '/settings/channels')
})


