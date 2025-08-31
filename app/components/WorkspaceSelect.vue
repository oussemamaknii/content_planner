<template>
  <div v-if="workspaces?.length" class="inline-flex items-center gap-2">
    <label class="text-sm text-gray-600">Workspace</label>
    <select v-model="currentWorkspaceId" class="rounded border border-gray-300 px-2 py-1">
      <option v-for="w in workspaces" :key="w.id" :value="w.id">{{ w.name }}<span v-if="w.owner"> ({{ w.owner }})</span></option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter, useRoute } from '#imports'
import { useWorkspaces } from '../../composables/useWorkspaces'

const router = useRouter()
const route = useRoute()
const { workspaces, currentWorkspaceId, refresh } = useWorkspaces()
onMounted(() => { refresh() })
watch(currentWorkspaceId, async (w) => {
  const q = { ...route.query, w: w || undefined }
  await router.replace({ query: q })
})
</script>


