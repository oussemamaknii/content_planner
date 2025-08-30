<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">Editor</h1>
      <div class="flex items-center gap-2">
        <select v-model="status" class="rounded border border-gray-300 px-2 py-1">
          <option value="DRAFT">Draft</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <input v-if="status==='SCHEDULED'" v-model="scheduledAt" type="datetime-local" class="rounded border border-gray-300 px-2 py-1" />
        <button class="btn" @click="save">Save</button>
      </div>
    </div>

    <div v-if="pending" class="text-sm text-gray-600">Loading…</div>
    <div v-else-if="!item">Not found</div>
    <div v-else class="space-y-6">
      <input v-model="title" class="w-full rounded border border-gray-300 px-3 py-2" placeholder="Title" />
      <textarea v-model="body" class="w-full min-h-[300px] rounded border border-gray-300 px-3 py-2" placeholder="Write…" />
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <h2 class="font-medium">Médias</h2>
          <button class="btn" @click="showPicker = !showPicker">{{ showPicker ? 'Fermer' : 'Ajouter' }}</button>
        </div>
        <MediaPicker v-if="showPicker" @select="onPick" />
        <div v-if="assets.length" class="space-y-2">
          <div v-for="link in assets" :key="link.id" class="border rounded p-2 flex items-start gap-3">
            <div class="w-24 h-16 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
              <template v-if="isImage(link.asset.mimeType, link.asset.key)">
                <img :src="signedMap[link.asset.key] || ''" alt="thumb" class="w-full h-full object-cover" />
              </template>
              <template v-else-if="isVideo(link.asset.mimeType, link.asset.key)">
                <img v-if="signedMap[link.asset.key + '.poster.jpg']" :src="signedMap[link.asset.key + '.poster.jpg']" alt="poster" class="w-full h-full object-cover" />
                <video v-else :src="signedMap[link.asset.key] || ''" class="w-full h-full object-cover" preload="metadata" muted playsinline></video>
              </template>
            </div>
            <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label class="text-xs text-gray-600">Role</label>
                <select v-model="link.role" class="rounded border border-gray-300 px-2 py-1" @change="updateLink(link)">
                  <option value="main">main</option>
                  <option value="secondary">secondary</option>
                  <option value="thumbnail">thumbnail</option>
                </select>
              </div>
              <div>
                <label class="text-xs text-gray-600">Alt</label>
                <input v-model="link.alt" class="w-full rounded border border-gray-300 px-2 py-1" @blur="updateLink(link)" />
              </div>
              <div class="md:col-span-2">
                <label class="text-xs text-gray-600">Caption</label>
                <input v-model="link.caption" class="w-full rounded border border-gray-300 px-2 py-1" @blur="updateLink(link)" />
              </div>
            </div>
            <button class="btn" @click="removeLink(link.id)">Remove</button>
          </div>
        </div>
        <div v-else class="text-sm text-gray-600">Aucun média lié.</div>
      </div>
      <div class="text-xs text-gray-600">Updated: {{ human(item.updatedAt) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from '#imports'
import { useContentItem, updateContent, type ContentDetail } from '../../../composables/useContent'
import MediaPicker from '../../components/MediaPicker.vue'
import { $fetch } from 'ofetch'

const route = useRoute()
const id = computed(() => String(route.params.id))
const { data, pending, refresh } = useContentItem(id)
const item = computed<ContentDetail | null>(() => (data.value as any) ?? null)

const title = ref('')
const body = ref('')
const status = ref<'DRAFT'|'SCHEDULED'|'PUBLISHED'|'ARCHIVED'>('DRAFT')
const scheduledAt = ref<string>('')
const showPicker = ref(false)
const assets = ref<any[]>([])
const signedMap = ref<Record<string, string>>({})

watch(item, (val) => {
  if (!val) return
  title.value = val.title
  body.value = val.version?.body ?? ''
  status.value = val.status
  scheduledAt.value = val.scheduledAt ? toLocalInput(val.scheduledAt) : ''
  assets.value = (val as any)?.assets ?? []
  // Prefetch signed URLs for thumbnails
  preloadSigned()
}, { immediate: true })

function toLocalInput(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function human(iso: string) { try { return new Date(iso).toLocaleString() } catch { return iso } }

async function save() {
  await updateContent(id.value, {
    title: title.value,
    body: body.value,
    status: status.value,
    scheduledAt: status.value === 'SCHEDULED' ? (scheduledAt.value ? new Date(scheduledAt.value).toISOString() : null) : undefined
  })
  await refresh()
}

function isImage(mime: string, key: string) {
  return /^image\//.test(mime || '') || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(key || '')
}
function isVideo(mime: string, key: string) {
  return /^video\//.test(mime || '') || /\.(mp4|webm|ogg|mov|m4v)$/i.test(key || '')
}

async function signOnce(key: string) {
  if (signedMap.value[key]) return signedMap.value[key]
  try {
    const res: any = await $fetch('/api/media/sign', { query: { key } })
    if (res?.url) signedMap.value[key] = res.url
    return signedMap.value[key] || ''
  } catch {
    return ''
  }
}

async function preloadSigned() {
  const tasks: Promise<any>[] = []
  for (const link of assets.value) {
    const key = link.asset.key as string
    if (isImage(link.asset.mimeType, key)) {
      tasks.push(signOnce(key))
    } else if (isVideo(link.asset.mimeType, key)) {
      tasks.push(signOnce(key + '.poster.jpg'))
      tasks.push(signOnce(key))
    }
  }
  await Promise.all(tasks)
}
function signed(key: string) { return `/api/media/sign?key=${encodeURIComponent(key)}` }

async function onPick(payload: { ids: string[]; keys: string[] }) {
  await $fetch(`/api/content/${encodeURIComponent(id.value)}/assets`, { method: 'POST', body: { keys: payload.keys } })
  await refresh()
  showPicker.value = false
}

async function updateLink(link: any) {
  await $fetch(`/api/content/${encodeURIComponent(id.value)}/assets/${encodeURIComponent(link.id)}`, {
    method: 'PATCH',
    body: { role: link.role, caption: link.caption ?? null, alt: link.alt ?? null }
  })
}

async function removeLink(linkId: string) {
  await $fetch(`/api/content/${encodeURIComponent(id.value)}/assets/${encodeURIComponent(linkId)}`, { method: 'DELETE' })
  await refresh()
}
</script>

<style scoped>
.btn { @apply rounded bg-gray-900 text-white px-3 py-2 hover:bg-black/80; }
</style>
