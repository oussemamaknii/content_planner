import { readdir, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { getSupabaseServerClient } from '../../utils/supabase'
import { assertWorkspaceRole } from '../../utils/authz'
import { generatePosterFromVideoBuffer } from '../../utils/video'
import { prismaClient } from '../../utils/prisma'
import { probeMediaBuffer } from '../../utils/ffprobe'

export default eventHandler(async (event) => {
  const body = await readBody<{ uploadId: string; key: string; contentType?: string }>(event)
  if (!body?.uploadId || !body?.key) throw createError({ statusCode: 400, statusMessage: 'Missing fields' })
  const workspaceId = body.key.split('/')[0]
  await assertWorkspaceRole(event, workspaceId, 'EDITOR')

  const tmpDir = join(process.cwd(), '.uploads', body.uploadId)
  const parts = (await readdir(tmpDir)).sort()
  // Concat in memory per part; for very large files, we should stream-merge but this is a compromise
  const buffers: Buffer[] = []
  for (const p of parts) buffers.push(await readFile(join(tmpDir, p)))
  const full = Buffer.concat(buffers)

  const supa = getSupabaseServerClient()
  const bucket = process.env.SUPABASE_BUCKET ?? 'media'
  // Diagnostics: log key role (service_role vs anon) without leaking the token
  try {
    const token = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const payloadJson = token.split('.')[1] ? Buffer.from(token.split('.')[1], 'base64').toString('utf8') : '{}'
    const payload = JSON.parse(payloadJson)
    // eslint-disable-next-line no-console
    console.log('chunk.complete using bucket/key', { bucket, key: body.key, supabaseKeyRole: payload?.role || 'unknown' })
  } catch {
    // eslint-disable-next-line no-console
    console.log('chunk.complete using bucket/key', { bucket, key: body.key, supabaseKeyRole: 'unreadable' })
  }

  const { error } = await supa.storage.from(bucket).upload(body.key, full, { contentType: body.contentType || 'application/octet-stream', upsert: false })
  // cleanup
  await rm(tmpDir, { recursive: true, force: true })
  if (error) {
    // eslint-disable-next-line no-console
    console.error('chunk.complete upload error', { message: error.message, name: (error as any)?.name, status: (error as any)?.status, statusCode: (error as any)?.statusCode })
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
  // Generate poster for videos
  if ((body.contentType || '').startsWith('video/')) {
    try {
      const poster = await generatePosterFromVideoBuffer(full)
      const posterKey = `${body.key}.poster.jpg`
      await supa.storage.from(bucket).upload(posterKey, poster, { contentType: 'image/jpeg', upsert: true })
    } catch (e) {
      console.error('poster generation failed', (e as any)?.message || e)
    }
  }
  // Upsert MediaAsset row with metadata
  try {
    const meta = await probeMediaBuffer(full)
    await prismaClient.mediaAsset.upsert({
      where: { workspaceId_key: { workspaceId, key: body.key } },
      update: { mimeType: body.contentType || 'application/octet-stream', width: meta.width ?? undefined, height: meta.height ?? undefined, durationSeconds: meta.durationSeconds ?? undefined },
      create: { workspaceId, key: body.key, url: `supabase://${bucket}/${body.key}`, mimeType: body.contentType || 'application/octet-stream', width: meta.width ?? undefined, height: meta.height ?? undefined, durationSeconds: meta.durationSeconds ?? undefined, createdById: (await import('../../utils/authz')).requireSessionUserId ? await (await import('../../utils/authz')).requireSessionUserId(event) : 'unknown' }
    })
  } catch (e) {
    console.error('metadata probe failed', (e as any)?.message || e)
  }
  return { key: body.key }
})


