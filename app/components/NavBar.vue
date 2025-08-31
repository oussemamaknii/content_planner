<template>
  <nav class="flex items-center justify-between text-sm w-full">
    <div class="flex items-center gap-4">
      <NuxtLink :to="withW('/')" class="link" :class="{ active: route.path === '/' }">Home</NuxtLink>
      <NuxtLink :to="withW('/content')" class="link" :class="{ active: route.path.startsWith('/content') }">Content</NuxtLink>
      <NuxtLink :to="withW('/media')" class="link" :class="{ active: route.path.startsWith('/media') }">Media</NuxtLink>
      <NuxtLink :to="withW('/calendar')" class="link" :class="{ active: route.path.startsWith('/calendar') }">Calendar</NuxtLink>
      <NuxtLink v-if="isAdmin" :to="withW('/admin')" class="link" :class="{ active: route.path.startsWith('/admin') }">Admin</NuxtLink>
      <NuxtLink :to="withW('/settings/members')" class="link" :class="{ active: route.path.startsWith('/settings') }">Settings</NuxtLink>
      <NuxtLink v-if="isAdmin" :to="withW('/settings/channels')" class="link" :class="{ active: route.path.startsWith('/settings/channels') }">Channels</NuxtLink>
    </div>
    <div class="flex items-center gap-3">
      <NuxtLink v-if="status==='authenticated'" to="/settings/profile" class="flex items-center gap-2">
        <img v-if="session?.user?.image" :src="session.user.image" alt="avatar" class="h-8 w-8 rounded-full object-cover border border-gray-300" />
        <div v-else class="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-700">
          {{ (session?.user?.name || session?.user?.email || 'U').slice(0,1).toUpperCase() }}
        </div>
        <span class="link">Profile</span>
      </NuxtLink>
      <button v-if="status==='authenticated'" class="link" @click="logout">Se déconnecter</button>
      <NuxtLink v-else to="/auth/signin" class="link">Se connecter</NuxtLink>
    </div>
  </nav>
  </template>

<script setup lang="ts">
import { useRoute, useAuth } from '#imports'
import { useWorkspaces } from '../../composables/useWorkspaces'
const route = useRoute()
const { status, signOut, data: session } = useAuth()
const isAdmin = computed(() => {
  const role = (useState<any>('workspaces').value || []).find((w: any) => w.id === useState<string | null>('currentWorkspaceId').value)?.role
  return role === 'ADMIN' || role === 'OWNER'
})

const { currentWorkspaceId } = useWorkspaces()
function withW(path: string) { return { path, query: currentWorkspaceId.value ? { w: currentWorkspaceId.value } : {} } }

async function logout() {
  try { await signOut({ callbackUrl: '/' }) } catch {}
}
</script>

<style scoped>
.link { @apply px-2 py-1 rounded hover:bg-gray-100 text-gray-700; }
.active { @apply bg-gray-200 font-medium; }
</style>


