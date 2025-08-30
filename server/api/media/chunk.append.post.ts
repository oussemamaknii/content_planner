import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { assertWorkspaceRole } from '../../utils/authz'

export default eventHandler(async (event) => {
  const workspaceId = event.context.workspaceId as string | undefined
  if (!workspaceId) throw createError({ statusCode: 400, statusMessage: 'No workspace' })
  await assertWorkspaceRole(event, workspaceId, 'EDITOR')

  const form = (await readMultipartFormData(event)) as Array<{
    name: string
    data?: Buffer
    filename?: string
    type?: string
  }>
  if (!form) throw createError({ statusCode: 400, statusMessage: 'No multipart' })
  const uploadId = form.find(f => f.name === 'uploadId')?.data?.toString()
  const partName = form.find(f => f.name === 'partName')?.data?.toString() || Date.now().toString()
  const chunk = form.find(f => f.name === 'chunk')

  // Debug log: received fields summary (no binary content printed)
  // eslint-disable-next-line no-console
  console.log('chunk.append received', {
    uploadId,
    partName,
    fields: form.map(f => ({
      name: f.name,
      hasFilename: Boolean(f.filename),
      type: f.type,
      size: f.data?.length ?? 0
    }))
  })

  if (!uploadId || !chunk?.data) throw createError({ statusCode: 400, statusMessage: 'Missing uploadId or chunk' })

  const tmpDir = join(process.cwd(), '.uploads', uploadId)
  await writeFile(join(tmpDir, partName), chunk.data)
  return { ok: true }
})


