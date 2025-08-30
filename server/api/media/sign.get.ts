import { getSupabaseServerClient } from '../../utils/supabase'
import { assertWorkspaceRole } from '../../utils/authz'

export default eventHandler(async (event) => {
  const key = (getQuery(event).key as string | undefined) ?? ''
  if (!key) throw createError({ statusCode: 400, statusMessage: 'Missing key' })
  const decoded = decodeURIComponent(key)
  const workspaceId = decoded.split('/')[0]
  if (!workspaceId) throw createError({ statusCode: 400, statusMessage: 'Invalid key' })
  await assertWorkspaceRole(event, workspaceId, 'VIEWER')

  const bucket = process.env.SUPABASE_BUCKET ?? 'media'
  const supa = getSupabaseServerClient()
  const { data, error } = await supa.storage.from(bucket).createSignedUrl(decoded, 60 * 60)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { url: data?.signedUrl ?? null }
})


