<template>
  <div class="p-6 space-y-6">
    <h1 class="text-xl font-semibold">Admin Dashboard</h1>
    <div v-if="pending" class="text-sm text-gray-600">Loading…</div>
    <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="card"><div class="label">Members</div><div class="value">{{ data?.users ?? 0 }}</div></div>
      <div class="card"><div class="label">Contents</div><div class="value">{{ data?.contents ?? 0 }}</div></div>
      <div class="card"><div class="label">Schedules</div><div class="value">{{ data?.scheduled ?? 0 }}</div></div>
      <div class="card"><div class="label">Assets</div><div class="value">{{ data?.assets ?? 0 }}</div></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAsyncData } from '#imports'
import { $fetch } from 'ofetch'

const { data, pending } = useAsyncData('admin-summary', () => $fetch('/api/admin/summary'))
</script>

<style scoped>
.card { @apply rounded border p-4 bg-white; }
.label { @apply text-xs text-gray-600; }
.value { @apply text-2xl font-semibold; }
</style>



