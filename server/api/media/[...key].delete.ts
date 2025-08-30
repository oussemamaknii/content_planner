import { getSupabaseServerClient } from '../../utils/supabase'
import { assertWorkspaceRole } from '../../utils/authz'

export default eventHandler(async (event) => {
  const keyParam = getRouterParam(event, 'key') as string
  if (!keyParam) throw createError({ statusCode: 400, statusMessage: 'Missing key' })
  const decoded = decodeURIComponent(keyParam)
  const workspaceId = decoded.split('/')[0]
  if (!workspaceId) throw createError({ statusCode: 400, statusMessage: 'Invalid key' })
  await assertWorkspaceRole(event, workspaceId, 'EDITOR')

  const bucket = process.env.SUPABASE_BUCKET ?? 'media'
  const supa = getSupabaseServerClient()
  const { error } = await supa.storage.from(bucket).remove([decoded])
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { ok: true }
})



