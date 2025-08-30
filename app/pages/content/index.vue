<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">Content</h1>
      <form class="flex gap-2" @submit.prevent="createItem()">
        <input v-model="title" placeholder="New content title" class="input" required />
        <button class="btn" type="submit">Create</button>
      </form>
    </div>

    <div class="flex items-center gap-3">
      <label>Status:</label>
      <select v-model="filterStatus" class="select" @change="reload()">
        <option value="">All</option>
        <option value="DRAFT">Draft</option>
        <option value="SCHEDULED">Scheduled</option>
        <option value="PUBLISHED">Published</option>
        <option value="ARCHIVED">Archived</option>
      </select>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="text-left text-gray-600">
            <th class="py-2 pr-4">Title</th>
            <th class="py-2 pr-4">Status</th>
            <th class="py-2 pr-4">Scheduled</th>
            <th class="py-2 pr-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="it in items || []" :key="it.id" class="border-t">
            <td class="py-2 pr-4">{{ it.title }}</td>
            <td class="py-2 pr-4">{{ it.status }}</td>
            <td class="py-2 pr-4">{{ it.scheduledAt ? new Date(it.scheduledAt).toLocaleString() : '—' }}</td>
            <td class="py-2 pr-4 flex gap-2">
              <NuxtLink class="btn" :to="`/content/${it.id}`">Edit</NuxtLink>
              <button class="btn btn-danger" @click="removeItem(it.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useContent } from '../../../composables/useContent'

const { items, list, create, remove } = useContent()
const title = ref('')
const filterStatus = ref('')

async function reload() {
  await list({ status: filterStatus.value || undefined })
}

async function createItem() {
  await create({ title: title.value })
  title.value = ''
  await reload()
}

async function removeItem(id: string) {
  await remove(id)
  await reload()
}

onMounted(reload)
</script>

<style scoped>
.input { @apply rounded border border-gray-300 px-3 py-2; }
.select { @apply rounded border border-gray-300 px-2 py-1 bg-white; }
.btn { @apply rounded bg-gray-900 text-white px-3 py-2 hover:bg-black/80; }
.btn-danger { @apply bg-red-600 hover:bg-red-700; }
</style>


