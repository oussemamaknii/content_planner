import { randomUUID } from 'node:crypto'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { assertWorkspaceRole } from '../../utils/authz'

export default eventHandler(async (event) => {
  const workspaceId = event.context.workspaceId as string | undefined
  if (!workspaceId) throw createError({ statusCode: 400, statusMessage: 'No workspace' })
  await assertWorkspaceRole(event, workspaceId, 'EDITOR')

  const body = await readBody<{ filename: string; size: number; contentType?: string }>(event)
  if (!body?.filename || !body?.size) throw createError({ statusCode: 400, statusMessage: 'Missing fields' })

  const uploadId = randomUUID()
  const key = `${workspaceId}/${Date.now()}_${body.filename}`
  const tmpDir = join(process.cwd(), '.uploads', uploadId)
  await mkdir(tmpDir, { recursive: true })
  return { uploadId, key }
})


