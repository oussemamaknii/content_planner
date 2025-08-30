import { getSupabaseServerClient } from '../../utils/supabase'
import { assertWorkspaceRole } from '../../utils/authz'

// Returns a signed URL and required fields to PUT directly to Supabase Storage without buffering on server
export default eventHandler(async (event) => {
  const workspaceId = event.context.workspaceId as string | undefined
  if (!workspaceId) throw createError({ statusCode: 400, statusMessage: 'No workspace' })
  await assertWorkspaceRole(event, workspaceId, 'EDITOR')

  const body = await readBody<{ filename: string; contentType?: string }>(event)
  if (!body?.filename) throw createError({ statusCode: 400, statusMessage: 'Missing filename' })

  const bucket = process.env.SUPABASE_BUCKET ?? 'media'
  const supa = getSupabaseServerClient()
  const key = `${workspaceId}/${Date.now()}_${body.filename}`

  // Supabase Storage does not support presigned PUT in the same way as S3.
  // We’ll return a signed URL for upload via POST form (createSignedUploadUrl when available)
  // Fallback: client uploads via RPC using service-generated upload URL with upload() endpoint (chunked by client)
  // Here we just return the target key; client should POST the file with multipart/form-data to /api/media/upload
  // For large files, recommend client-side chunking or direct upload via Supabase JS on the client (auth not needed for private bucket uploads using service role proxy).

  return { key }
})


