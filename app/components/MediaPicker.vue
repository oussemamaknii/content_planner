<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <div class="font-medium">Media Library</div>
      <div class="flex items-center gap-2">
        <button class="btn" @click="trigger">Upload</button>
        <input ref="fileInput" type="file" class="hidden" @change="onFile" multiple />
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <label v-for="it in items" :key="it.id" class="border rounded p-2 cursor-pointer flex gap-2">
        <input type="checkbox" :value="it" v-model="selected" />
        <div class="flex-1">
          <div class="text-xs text-gray-600 truncate">{{ it.name }}</div>
          <img v-if="isImage(it.name)" :src="preview(it)" alt="preview" class="w-full h-24 object-cover rounded mt-1" />
        </div>
      </label>
    </div>

    <div class="flex items-center justify-end gap-2">
      <button class="btn" :disabled="!selected.length" @click="emitSelect">Add selected</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { $fetch } from 'ofetch'

type MediaItem = { id: string; name: string }

const emit = defineEmits<{ (e: 'select', payload: { ids: string[]; keys: string[] }): void }>()

const items = ref<MediaItem[]>([])
const selected = ref<MediaItem[]>([])
const fileInput = ref<HTMLInputElement | null>(null)

function isImage(name: string) { return /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(name) }
function preview(it: MediaItem) { return `/api/media/sign?key=${encodeURIComponent(it.id)}` }
function trigger() { fileInput.value?.click() }

async function list() {
  try {
    const res: any = await $fetch('/api/media')
    items.value = res?.items ?? []
  } catch (e) { console.error(e) }
}

async function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files || !input.files.length) return
  // Reuse existing upload endpoint (simple path)
  const fd = new FormData()
  // Only first file for simplicity here; can be extended to multiple
  fd.append('file', input.files[0])
  await fetch('/api/media/upload', { method: 'POST', body: fd })
  await list()
  input.value = ''
}

function emitSelect() {
  const ids = selected.value.map(s => s.id)
  const keys = ids // id ici correspond à key côté storage
  emit('select', { ids, keys })
  selected.value = []
}

onMounted(list)
</script>

<style scoped>
.btn { @apply rounded bg-gray-900 text-white px-3 py-2 hover:bg-black/80; }
</style>


