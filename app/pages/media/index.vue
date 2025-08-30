<template>
  <div class="p-6 space-y-6">
    <h1 class="text-xl font-semibold">Media Library</h1>

    <form @submit.prevent class="flex items-center gap-3" enctype="multipart/form-data">
      <input ref="fileInput" type="file" class="file-input" @change="onFile" aria-label="Upload file" />
      <button class="btn" @click="trigger">Upload</button>
      <div v-if="uploading" class="flex items-center gap-2">
        <div class="h-2 w-40 bg-gray-200 rounded overflow-hidden">
          <div class="h-2 bg-gray-900" :style="{ width: progress + '%' }"></div>
        </div>
        <span class="text-xs text-gray-600">{{ Math.floor(progress) }}%</span>
      </div>
    </form>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="it in items" :key="it.id" class="border rounded p-2 flex flex-col gap-2">
        <div class="text-xs text-gray-600 truncate">{{ it.name }}</div>
        <div v-if="previewUrls[it.id]">
          <img v-if="isImage(it.name)" :src="previewUrls[it.id]" alt="preview" class="w-full h-40 object-cover rounded" />
          <video v-else-if="isVideo(it.name)" :src="previewUrls[it.id]" controls class="w-full h-40 rounded" />
          <a v-else :href="previewUrls[it.id]" target="_blank" class="text-blue-600 underline">Open</a>
        </div>
        <div class="flex gap-2">
          <button class="btn" @click="sign(it.id)">Preview</button>
          <button class="btn btn-danger" @click="remove(it.id)">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useFetch } from '#imports'
import { $fetch } from 'ofetch'
import { createClient } from '@supabase/supabase-js'

type MediaItem = { id: string; name: string }
const items = ref<MediaItem[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const previewUrls = ref<Record<string, string>>({})
const uploading = ref(false)
const progress = ref(0)

async function list() {
  try {
    const res: any = await $fetch('/api/media')
    items.value = (res?.items ?? []) as MediaItem[]
  } catch (e) { console.error(e) }
}

function trigger() { fileInput.value?.click() }

async function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files || !input.files.length) return
  const file = input.files[0]
  try {
    // 1) Try server upload with progress via XHR
    uploading.value = true
    progress.value = 0
    // For large files, use chunked proxy directly (safer)
    const chunkThreshold = 8 * 1024 * 1024 // 8MB
    if (file.size > chunkThreshold) {
      await chunkUpload(file)
    } else {
      await xhrUpload(file)
    }
  } catch (err: any) {
    // If payload too large (413), fallback to client Supabase upload
    if (err?.status === 413) {
      await chunkUpload(file)
    } else {
      console.error(err)
    }
  } finally {
    uploading.value = false
    progress.value = 0
    input.value = ''
    await list()
  }
}

async function remove(id: string) {
  await $fetch(`/api/media/${encodeURIComponent(id)}`, { method: 'DELETE' })
  await list()
}

function isImage(name: string) {
  return /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(name)
}
function isVideo(name: string) {
  return /\.(mp4|webm|ogg)$/i.test(name)
}

async function sign(id: string) {
  try {
    const res: any = await $fetch('/api/media/sign', { query: { key: id } })
    const url = res?.url as string | null
    if (url) previewUrls.value[id] = url
  } catch (e) { console.error(e) }
}

function xhrUpload(file: File) {
  return new Promise<void>((resolve, reject) => {
    const fd = new FormData()
    fd.append('file', file)
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/media/upload', true)
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        progress.value = (ev.loaded / ev.total) * 100
      }
    }
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) resolve()
        else reject({ status: xhr.status, message: xhr.responseText })
      }
    }
    xhr.onerror = () => reject({ status: xhr.status, message: 'xhr error' })
    xhr.send(fd)
  })
}

async function supabaseFallbackUpload(file: File) {
  // Requires public env vars set: NUXT_PUBLIC_SUPABASE_URL, NUXT_PUBLIC_SUPABASE_ANON_KEY and private bucket policy allowing insert for anon or logged-in users
  const url = (import.meta as any).env.NUXT_PUBLIC_SUPABASE_URL || (process as any).env.NUXT_PUBLIC_SUPABASE_URL
  const anon = (import.meta as any).env.NUXT_PUBLIC_SUPABASE_ANON_KEY || (process as any).env.NUXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) throw new Error('Supabase public env missing')
  const supa = createClient(url, anon)
  // Ask server for a target key (keeps path convention/workspace segregation)
  const { data: signedData } = await useFetch('/api/media/signed-upload', { method: 'POST', body: { filename: file.name, contentType: file.type } })
  const key = (signedData.value as any)?.key as string
  if (!key) throw new Error('No key from server')
  // Note: supabase-js upload does not provide progress events; we set indeterminate UI
  progress.value = 50
  const bucket = (import.meta as any).env.NUXT_PUBLIC_SUPABASE_BUCKET || (process as any).env.NUXT_PUBLIC_SUPABASE_BUCKET || 'media'
  const { error } = await supa.storage.from(bucket).upload(key, file, { upsert: false, contentType: file.type })
  if (error) throw error
  progress.value = 100
}

async function chunkUpload(file: File) {
  // 1) init
  const initRes: any = await $fetch('/api/media/chunk.init', {
    method: 'POST',
    body: { filename: file.name, size: file.size, contentType: file.type }
  })
  const { uploadId, key } = initRes
  if (!uploadId || !key) throw new Error('Invalid init response')

  // 2) append chunks
  const chunkSize = 5 * 1024 * 1024 // 5MB
  let offset = 0
  let partIndex = 0
  let uploaded = 0
  while (offset < file.size) {
    const end = Math.min(offset + chunkSize, file.size)
    const blob = file.slice(offset, end)
    const partName = `part_${String(partIndex).padStart(6, '0')}`
    await xhrAppendChunk(uploadId, partName, blob, (loaded) => {
      progress.value = ((uploaded + loaded) / file.size) * 100
    })
    uploaded += blob.size
    offset = end
    partIndex++
    progress.value = (uploaded / file.size) * 100
  }

  // 3) complete
  await $fetch('/api/media/chunk.complete', {
    method: 'POST',
    body: { uploadId, key, contentType: file.type }
  })
}

function xhrAppendChunk(uploadId: string, partName: string, blob: Blob, onProgress: (loaded: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const fd = new FormData()
    fd.append('uploadId', uploadId)
    fd.append('partName', partName)
    fd.append('chunk', blob, 'chunk.bin')
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/media/chunk.append', true)
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) onProgress(ev.loaded)
    }
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) resolve()
        else reject({ status: xhr.status, message: xhr.responseText })
      }
    }
    xhr.onerror = () => reject({ status: xhr.status, message: 'xhr error' })
    xhr.send(fd)
  })
}

onMounted(list)
</script>

<style scoped>
.btn { @apply rounded bg-gray-900 text-white px-3 py-2 hover:bg-black/80; }
.btn-danger { @apply bg-red-600 hover:bg-red-700; }
.file-input { @apply rounded border border-gray-300 px-3 py-2; }
</style>



