<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">Content</h1>
      <div class="flex items-center gap-2">
        <select v-model="status" class="rounded border border-gray-300 px-2 py-1">
          <option value="">All</option>
          <option value="DRAFT">Draft</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <button class="btn" @click="newContent">New</button>
      </div>
    </div>

    <div v-if="pending" class="text-sm text-gray-600">Loading…</div>
    <div v-else>
      <div class="grid grid-cols-1 gap-3">
        <div v-for="it in items" :key="it.id" class="border rounded p-3 hover:bg-gray-50 flex items-center justify-between">
          <div>
            <div class="font-medium">{{ it.title }}</div>
            <div class="text-xs text-gray-600 flex gap-2">
              <span>Status: {{ it.status }}</span>
              <span v-if="it.scheduledAt">Scheduled: {{ human(it.scheduledAt) }}</span>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <NuxtLink class="text-blue-600 underline" :to="`/content/${it.id}`">Open</NuxtLink>
            <button class="text-red-600 underline" @click="remove(it.id)">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useContentList, type ContentSummary, createContent, deleteContent } from '../../../composables/useContent'

const status = ref('')
const params = computed(() => ({ status: status.value as any, take: 20, skip: 0 }))
const { data, pending, refresh } = useContentList(params)
const items = computed<ContentSummary[]>(() => data.value?.items ?? [])

function human(iso: string) {
  try { return new Date(iso).toLocaleString() } catch { return iso }
}

async function newContent() {
  const id = await createContent({ title: 'Untitled' })
  await refresh()
  navigateTo(`/content/${id}`)
}

async function remove(id: string) {
  if (!confirm('Delete this content?')) return
  await deleteContent(id)
  await refresh()
}
</script>

<style scoped>
.btn { @apply rounded bg-gray-900 text-white px-3 py-2 hover:bg-black/80; }
</style>
