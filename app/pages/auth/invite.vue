<template>
  <main class="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-16">
    <div class="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h1 class="text-xl font-semibold">Invitation</h1>
      <p class="mt-1 text-sm text-gray-600" v-if="pending">Chargement…</p>
      <div v-else>
        <p class="mt-1 text-sm text-gray-600">Tu es invité à rejoindre ce workspace.</p>
        <div class="mt-4 text-sm">
          <div><span class="font-medium">Email:</span> {{ info?.email }}</div>
          <div><span class="font-medium">Role:</span> {{ info?.role }}</div>
          <div><span class="font-medium">Expire:</span> {{ info?.expiresAt ? new Date(info.expiresAt).toLocaleString() : '' }}</div>
        </div>
        <div class="mt-6 flex gap-2">
          <button class="w-full rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800" @click="accept">Accepter</button>
          <NuxtLink to="/auth/signin" class="w-full text-center rounded-md border border-gray-300 px-4 py-2">Se connecter</NuxtLink>
        </div>
      </div>
    </div>
  </main>
  </template>

<script setup lang="ts">
import { useRoute } from '#imports'
import { $fetch } from 'ofetch'
import { ref } from 'vue'

const route = useRoute()
const token = String(route.query.token || '')
const info = ref<any>(null)
const pending = ref(true)

async function load() {
  try {
    info.value = await $fetch(`/api/invitations/${encodeURIComponent(token)}`)
  } catch (e) {
    info.value = null
  } finally {
    pending.value = false
  }
}

async function accept() {
  try {
    await $fetch(`/api/invitations/${encodeURIComponent(token)}`, { method: 'POST' })
    navigateTo('/')
  } catch (e: any) {
    alert(e?.data?.statusMessage || e?.message || 'Accept failed')
  }
}

load()
</script>


