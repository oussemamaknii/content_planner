<template>
  <div class="p-6 space-y-6" v-if="data">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">Edit: {{ data.title }}</h1>
      <div class="flex items-center gap-2">
        <label>Status</label>
        <select v-model="status" class="select">
          <option value="DRAFT">Draft</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <input v-model="scheduledAt" type="datetime-local" class="input" />
        <button class="btn" @click="saveMeta()">Save meta</button>
      </div>
    </div>

    <div class="space-y-2">
      <label class="text-sm">Body</label>
      <textarea v-model="body" rows="12" class="w-full rounded border border-gray-300 p-3"></textarea>
      <div class="flex gap-2">
        <button class="btn" @click="saveBody()">Save version</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from '#imports'
import { useFetch } from '#imports'
import { useContent } from '../../../composables/useContent'

const route = useRoute()
const id = route.params.id as string
const { update } = useContent()

const data = ref<any>(null)
const status = ref('DRAFT')
const scheduledAt = ref<string | ''>('')
const body = ref('')

async function load() {
  const { data: d } = await useFetch(`/api/content/${id}`)
  data.value = d.value
  status.value = (d.value as any)?.status ?? 'DRAFT'
  const sched = (d.value as any)?.scheduledAt as string | null
  scheduledAt.value = sched ? new Date(sched).toISOString().slice(0,16) : ''
  body.value = (d.value as any)?.version?.body ?? ''
}

async function saveMeta() {
  await update(id, {
    status: status.value,
    scheduledAt: scheduledAt.value ? new Date(scheduledAt.value).toISOString() : null
  })
  await load()
}

async function saveBody() {
  await update(id, { body: body.value })
  await load()
}

onMounted(load)
</script>

<style scoped>
.input { @apply rounded border border-gray-300 px-3 py-2; }
.select { @apply rounded border border-gray-300 px-2 py-1 bg-white; }
.btn { @apply rounded bg-gray-900 text-white px-3 py-2 hover:bg-black/80; }
</style>


