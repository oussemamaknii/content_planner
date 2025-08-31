<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">Calendar</h1>
      <div class="flex items-center gap-2">
        <button class="btn" @click="prevWeek">Prev</button>
        <div class="text-sm">{{ fmt(day0) }} - {{ fmt(day6) }}</div>
        <button class="btn" @click="nextWeek">Next</button>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-4">
      <aside class="col-span-12 md:col-span-3 space-y-2">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-medium">Drafts</h2>
          <button class="text-xs underline" @click="loadDrafts">Refresh</button>
        </div>
        <div v-if="drafts.length" class="space-y-2">
          <div v-for="d in drafts" :key="d.id" class="rounded border p-2 bg-white text-xs cursor-move"
               draggable="true" @dragstart="onDragStartDraft(d)">
            <div class="font-medium truncate">{{ d.title }}</div>
            <div class="text-gray-600">CONTENT · DRAFT</div>
          </div>
        </div>
        <div v-else class="text-xs text-gray-600">No drafts.</div>
      </aside>

      <section class="col-span-12 md:col-span-9">
        <div v-if="!hasItems" class="text-sm text-gray-600 mb-2">Aucun élément planifié cette semaine. Glisse un draft vers un jour pour le planifier.</div>
        <div class="grid grid-cols-7 gap-2">
          <div v-for="(d, idx) in days" :key="idx" class="border rounded p-2 min-h-[220px] bg-white/10"
               @dragover.prevent
               @drop="onDropDay(idx, $event)">
            <div class="text-xs text-gray-600 mb-2">{{ d.toDateString() }}</div>
            <div class="space-y-2 min-h-[160px]">
              <div v-for="it in grouped[idx]" :key="it.id" class="rounded bg-white shadow p-2 text-xs cursor-move"
                   draggable="true" @dragstart="onDragStart(it)" @dblclick="editTime(it)">
                <div class="font-medium truncate">{{ it.content.title }}</div>
                <div class="text-gray-600">{{ it.channel?.type || 'CONTENT' }} · {{ new Date(it.scheduledFor).toLocaleTimeString() }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { $fetch } from 'ofetch'

type Item = { id: string; scheduledFor: string; status: string; content: { id: string; title: string; status: string }; channel: { id: string; type: string; name: string } }

const start = ref(startOfWeek(new Date()))
const items = ref<Item[]>([])
const drafts = ref<{ id: string; title: string }[]>([])

const day0 = computed(() => start.value)
const day6 = computed(() => new Date(start.value.getTime() + 6 * 86400000))
const days = computed(() => Array.from({ length: 7 }, (_, i) => new Date(start.value.getTime() + i * 86400000)))

function startOfWeek(dt: Date) {
  const d = new Date(dt)
  const day = (d.getDay() + 6) % 7 // Monday start
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - day)
  return d
}

function fmt(d: Date) {
  return d.toLocaleDateString()
}

async function load() {
  const res: any = await $fetch('/api/calendar', { query: { start: day0.value.toISOString(), end: day6.value.toISOString() } })
  items.value = res?.items ?? []
}

async function loadDrafts() {
  try {
    const res: any = await $fetch('/api/content', { query: { status: 'DRAFT', take: 100, skip: 0 } })
    drafts.value = (res?.items ?? [])
  } catch { drafts.value = [] }
}

function prevWeek() { start.value = new Date(start.value.getTime() - 7 * 86400000); load() }
function nextWeek() { start.value = new Date(start.value.getTime() + 7 * 86400000); load() }

const grouped = computed(() => {
  const g: Record<number, Item[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
  for (const it of items.value) {
    const dt = new Date(it.scheduledFor)
    const idx = Math.floor((dt.getTime() - day0.value.getTime()) / 86400000)
    if (idx >= 0 && idx < 7) (g as any)[idx].push(it)
  }
  return [g[0], g[1], g[2], g[3], g[4], g[5], g[6]]
})

const hasItems = computed(() => items.value.length > 0)

load(); loadDrafts()

let dragging: Item | null = null
function onDragStart(it: Item) { dragging = it }
function onDragStartDraft(d: { id: string; title: string }) {
  dragging = { id: `content:${d.id}`, scheduledFor: new Date().toISOString(), status: 'DRAFT', content: { id: d.id, title: d.title, status: 'DRAFT' }, channel: { id: '', type: 'CONTENT', name: 'CONTENT' } } as any
}
async function onDropDay(idx: number, e: DragEvent) {
  if (!dragging) return
  const dt = new Date(day0.value.getTime() + idx * 86400000)
  dt.setHours(10, 0, 0, 0) // default drop time 10:00
  if (String(dragging.id).startsWith('content:')) {
    const contentId = String(dragging.id).split(':')[1]
    try {
      await $fetch(`/api/content/${encodeURIComponent(contentId)}`, { method: 'PATCH', body: { scheduledAt: dt.toISOString(), status: 'SCHEDULED' } })
    } catch (e: any) {
      alert(e?.data?.message || e?.message || 'Scheduling failed')
    }
  } else {
    await $fetch(`/api/schedules/${encodeURIComponent(dragging.id)}`, { method: 'PATCH', body: { scheduledFor: dt.toISOString() } })
  }
  dragging = null
  await Promise.all([load(), loadDrafts()])
}

async function editTime(it: Item) {
  const current = new Date(it.scheduledFor)
  const hh = String(current.getHours()).padStart(2, '0')
  const mm = String(current.getMinutes()).padStart(2, '0')
  const input = prompt('New time (HH:mm):', `${hh}:${mm}`)
  if (!input) return
  const m = input.match(/^([01]?\d|2[0-3]):([0-5]\d)$/)
  if (!m) { alert('Invalid time'); return }
  const dt = new Date(current)
  dt.setHours(Number(m[1]), Number(m[2]), 0, 0)
  if (String(it.id).startsWith('content:')) {
    const contentId = String(it.id).split(':')[1]
    try {
      await $fetch(`/api/content/${encodeURIComponent(contentId)}`, { method: 'PATCH', body: { scheduledAt: dt.toISOString() } })
    } catch (e: any) { alert(e?.data?.message || e?.message || 'Update failed') }
  } else {
    await $fetch(`/api/schedules/${encodeURIComponent(it.id)}`, { method: 'PATCH', body: { scheduledFor: dt.toISOString() } })
  }
  await load()
}
</script>

<style scoped>
.btn { @apply rounded bg-gray-900 text-white px-3 py-2 hover:bg-black/80; }
</style>


