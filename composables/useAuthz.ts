import { useState } from '#imports'
import { computed } from 'vue';

type Role = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER'
const rank: Record<Role, number> = { OWNER: 4, ADMIN: 3, EDITOR: 2, VIEWER: 1 }

export function useAuthz() {
  const workspaces = useState<{ id: string; name: string; slug: string; role: Role }[] | null>('workspaces')
  const currentWorkspaceId = useState<string | null>('currentWorkspaceId')
  const currentRole = computed<Role | null>(() => {
    const ws = workspaces.value ?? []
    const id = currentWorkspaceId.value
    const m = ws.find(w => w.id === id)
    return (m?.role ?? null) as Role | null
  })

  function has(min: Role) {
    const r = currentRole.value
    return r ? rank[r] >= rank[min] : false
  }

  return { currentRole, has }
}


