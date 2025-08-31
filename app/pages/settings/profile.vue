<template>
  <div class="p-6 space-y-6">
    <h1 class="text-xl font-semibold">Profile</h1>
    <form class="space-y-4 max-w-md" @submit.prevent="save">
      <div>
        <label class="block text-sm text-gray-600">Name</label>
        <input v-model="name" class="w-full rounded border border-gray-300 px-3 py-2" />
      </div>
      <div>
        <label class="block text-sm text-gray-600">Avatar URL</label>
        <input v-model="image" class="w-full rounded border border-gray-300 px-3 py-2" />
      </div>
      <button class="btn" type="submit">Save</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { $fetch } from 'ofetch'

const name = ref('')
const image = ref('')

async function load() {
  try {
    const res: any = await $fetch('/api/me')
    name.value = res?.user?.name || ''
    image.value = res?.user?.image || ''
  } catch {}
}

async function save() {
  await $fetch('/api/me', { method: 'PATCH', body: { name: name.value, image: image.value || null } })
  await load()
}

load()
</script>

<style scoped>
.btn { @apply rounded bg-gray-900 text-white px-3 py-2 hover:bg-black/80; }
</style>


