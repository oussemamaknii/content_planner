import { getSupabaseServerClient } from '../../utils/supabase'
import { assertWorkspaceRole, requireSessionUserId } from '../../utils/authz'

export default eventHandler(async (event) => {
  const workspaceId = event.context.workspaceId as string | undefined
  if (!workspaceId) throw createError({ statusCode: 400, statusMessage: 'No workspace' })
  await assertWorkspaceRole(event, workspaceId, 'EDITOR')
  const userId = await requireSessionUserId(event)

  const form = await readMultipartFormData(event)
  if (!form || !form.length) throw createError({ statusCode: 400, statusMessage: 'No file' })
  const file = form.find(f => f.type === 'file')
  if (!file || !file.filename || !file.data) throw createError({ statusCode: 400, statusMessage: 'Invalid file' })
  // Hard limit 10MB for server-side buffered uploads
  const maxBytes = 10 * 1024 * 1024
  if (file.data.length > maxBytes) {
    throw createError({ statusCode: 413, statusMessage: 'Payload too large. Use signed upload endpoint.' })
  }

  const bucket = process.env.SUPABASE_BUCKET ?? 'media'
  const supa = getSupabaseServerClient()
  const key = `${workspaceId}/${Date.now()}_${file.filename}`

  const { error } = await supa.storage.from(bucket).upload(key, file.data, {
    contentType: file.type || 'application/octet-stream',
    upsert: false
  })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { key }
})



