<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">Channels</h1>
      <div class="flex items-center gap-2">
        <a class="btn" href="/api/oauth/linkedin/connect">Connect LinkedIn</a>
      </div>
    </div>

    <div>
      <h2 class="text-sm font-medium mb-2">Connected accounts</h2>
      <div class="space-y-2">
        <div v-for="a in accounts" :key="a.id" class="border rounded p-2">
          <div class="text-sm font-medium">{{ a.provider }} — {{ a.name || a.providerUserId }}</div>
          <div class="text-xs text-gray-600">Expires: {{ a.expiresAt ? new Date(a.expiresAt).toLocaleString() : '—' }}</div>
        </div>
        <div v-if="!accounts.length" class="text-sm text-gray-600">No accounts connected.</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { $fetch } from 'ofetch'

const accounts = ref<any[]>([])

async function load() {
  try {
    const res: any = await $fetch('/api/social-accounts')
    accounts.value = res?.accounts ?? []
  } catch { accounts.value = [] }
}

load()
</script>

<style scoped>
.btn { @apply rounded bg-gray-900 text-white px-3 py-2 hover:bg-black/80; }
</style>


