import { getSupabaseServerClient } from '../../utils/supabase'
import { assertWorkspaceRole } from '../../utils/authz'
import { prismaClient } from '../../utils/prisma'

export default eventHandler(async (event) => {
  const workspaceId = event.context.workspaceId as string | undefined
  if (!workspaceId) throw createError({ statusCode: 400, statusMessage: 'No workspace' })
  await assertWorkspaceRole(event, workspaceId, 'VIEWER')

  const q = getQuery(event)
  const prefix = (q.prefix as string | undefined) ?? ''
  const supa = getSupabaseServerClient()
  const bucket = process.env.SUPABASE_BUCKET ?? 'media'

  const { data, error } = await supa.storage.from(bucket).list(`${workspaceId}/${prefix}`, { sortBy: { column: 'created_at', order: 'desc' } })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { items: (data || []).map(o => ({ name: o.name, id: `${workspaceId}/${prefix}${o.name}`, createdAt: o.created_at, updatedAt: o.updated_at, size: o.metadata?.size ?? null })) }
})



