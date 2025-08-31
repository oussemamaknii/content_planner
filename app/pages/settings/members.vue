<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">Members</h1>
      <form class="flex gap-2" @submit.prevent="invite()">
        <input v-model="inviteEmail" type="email" required placeholder="email@example.com" class="input" aria-label="Invite by email" />
        <select v-model="inviteRole" class="select" aria-label="Role">
          <option value="EDITOR">Editor</option>
          <option value="ADMIN">Admin</option>
          <option value="VIEWER">Viewer</option>
        </select>
        <button class="btn" type="submit">Invite</button>
      </form>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="text-left text-gray-600">
            <th class="py-2 pr-4">User</th>
            <th class="py-2 pr-4">Email</th>
            <th class="py-2 pr-4">Role</th>
            <th class="py-2 pr-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in members" :key="m.id" class="border-t">
            <td class="py-2 pr-4">{{ m.user.name || '—' }}</td>
            <td class="py-2 pr-4">{{ m.user.email }}</td>
            <td class="py-2 pr-4">
              <select :value="m.role" @change="onChangeRole(m.id, ($event.target as HTMLSelectElement).value as Role)" class="select">
                <option value="OWNER">Owner</option>
                <option value="ADMIN">Admin</option>
                <option value="EDITOR">Editor</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </td>
            <td class="py-2 pr-4">
              <button class="btn btn-danger" @click="removeMember(m.id)">Remove</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useWorkspaces } from '../../../composables/useWorkspaces'
import { $fetch } from 'ofetch'

type Role = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER'

const { currentWorkspaceId } = useWorkspaces()
const inviteEmail = ref('')
const inviteRole = ref<Role>('EDITOR')
const members = ref<{ id: string; role: Role; user: { id: string; name: string | null; email: string; image: string | null } }[]>([])

const wsId = computed(() => currentWorkspaceId.value)

async function load() {
  if (!wsId.value) return
  try {
    const res: any = await $fetch(`/api/workspaces/${wsId.value}/members`)
    members.value = res?.members ?? []
  } catch {
    members.value = []
  }
}

async function invite() {
  if (!wsId.value || !inviteEmail.value) return
  try {
    await $fetch(`/api/workspaces/${wsId.value}/members`, { method: 'POST', body: { email: inviteEmail.value, role: inviteRole.value } })
    inviteEmail.value = ''
    await load()
  } catch (e: any) {
    // user not found -> create invitation
    if (String(e?.data?.statusMessage || '').includes('User not found')) {
      const res: any = await $fetch(`/api/workspaces/${wsId.value}/invitations`, { method: 'POST', body: { email: inviteEmail.value, role: inviteRole.value } })
      alert(`Invitation créée. Lien: ${res?.url}`)
      inviteEmail.value = ''
    } else {
      alert(e?.data?.statusMessage || e?.message || 'Invite failed')
    }
  }
}

async function onChangeRole(memberId: string, role: Role) {
  if (!wsId.value) return
  await $fetch(`/api/workspaces/${wsId.value}/members/${memberId}`, { method: 'PATCH', body: { role } })
  await load()
}

async function removeMember(memberId: string) {
  if (!wsId.value) return
  await $fetch(`/api/workspaces/${wsId.value}/members/${memberId}`, { method: 'DELETE' })
  await load()
}

onMounted(load)
</script>

<style scoped>
.input { @apply rounded border border-gray-300 px-3 py-2; }
.select { @apply rounded border border-gray-300 px-2 py-1 bg-white; }
.btn { @apply rounded bg-gray-900 text-white px-3 py-2 hover:bg-black/80; }
.btn-danger { @apply bg-red-600 hover:bg-red-700; }
</style>


