import { useState, useCookie, useRoute, useRouter, watch } from '#imports'
import { $fetch } from 'ofetch'

interface Workspace {
  id: string
  name: string
  slug: string
  role: string
  owner?: string | null
}

export function useWorkspaces() {
  const workspaces = useState<Workspace[] | null>(
    'workspaces',
    () => null
  )
  const currentWorkspaceId = useState<string | null>('currentWorkspaceId', () => null)
  const cwCookie = useCookie<string | null>('cw', { sameSite: 'lax' })
  const route = useRoute()
  const router = useRouter()

  async function refresh() {
    try {
      const res: any = await $fetch('/api/workspaces')
      workspaces.value = res?.workspaces ?? []
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('useWorkspaces.refresh error', e)
      workspaces.value = []
      return
    }

    // Try select order: query ?w= -> cookie cw -> first workspace
    const queryW = (route.query.w as string | undefined) ?? undefined
    const cookieW = cwCookie.value ?? undefined
    const knownIds = new Set((workspaces.value ?? []).map(w => w.id))
    const resolved = (queryW && knownIds.has(queryW)) ? queryW
      : (cookieW && knownIds.has(cookieW)) ? cookieW
      : (workspaces.value?.[0]?.id ?? null)
    if (resolved) currentWorkspaceId.value = resolved
  }

  async function create(name: string) {
    try {
      const ws: any = await $fetch('/api/workspaces', { method: 'POST', body: { name } })
      await refresh()
      if (ws?.id) currentWorkspaceId.value = ws.id
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('useWorkspaces.create error', e)
    }
  }

  // Sync selection -> cookie and URL query param
  watch(currentWorkspaceId, async (next, prev) => {
    if (!next) return
    cwCookie.value = next
    // update URL query w without full reload
    const q = { ...route.query, w: next }
    if (route.query.w !== next) {
      await router.replace({ query: q })
    }
  }, { immediate: false })

  return { workspaces, currentWorkspaceId, refresh, create }
}


