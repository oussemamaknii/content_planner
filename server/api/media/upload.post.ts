import { getSupabaseServerClient } from '../../utils/supabase'
import { assertWorkspaceRole, requireSessionUserId } from '../../utils/authz'
import { generatePosterFromVideoBuffer } from '../../utils/video'

export default eventHandler(async (event) => {
  const workspaceId = event.context.workspaceId as string | undefined
  if (!workspaceId) throw createError({ statusCode: 400, statusMessage: 'No workspace' })
  await assertWorkspaceRole(event, workspaceId, 'EDITOR')
  const userId = await requireSessionUserId(event)

  const form = await readMultipartFormData(event)
  if (!form || !form.length) throw createError({ statusCode: 400, statusMessage: 'No file' })
  const file = form.find(f => f.name === 'file')
  if (!file || !file.data) throw createError({ statusCode: 400, statusMessage: 'Invalid file' })
  // Hard limit 10MB for server-side buffered uploads
  const maxBytes = 10 * 1024 * 1024
  if (file.data.length > maxBytes) {
    throw createError({ statusCode: 413, statusMessage: 'Payload too large. Use signed upload endpoint.' })
  }

  const bucket = process.env.SUPABASE_BUCKET ?? 'media'
  const supa = getSupabaseServerClient()
  const filename = file.filename || `upload_${Date.now()}`
  const key = `${workspaceId}/${Date.now()}_${filename}`

  const contentType = (file.type && /\//.test(file.type)) ? file.type : 'application/octet-stream'
  const { error } = await supa.storage.from(bucket).upload(key, file.data, {
    contentType,
    upsert: false
  })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  // Generate poster for videos
  if ((contentType || '').startsWith('video/')) {
    try {
      const poster = await generatePosterFromVideoBuffer(file.data)
      const posterKey = `${key}.poster.jpg`
      await supa.storage.from(bucket).upload(posterKey, poster, { contentType: 'image/jpeg', upsert: true })
    } catch (e) {
      console.error('poster generation failed', (e as any)?.message || e)
    }
  }

  return { key }
})



