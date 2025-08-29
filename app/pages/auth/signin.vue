<template>
  <main class="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-16">
    <div class="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h1 class="text-xl font-semibold">Se connecter</h1>
      <p class="mt-1 text-sm text-gray-600">Choisis une méthode de connexion.</p>
      <div class="mt-6 space-y-3">
        <form class="space-y-3" @submit.prevent="signInEmail">
          <label class="block text-sm font-medium text-gray-700" for="email">Email</label>
          <input id="email" v-model="email" type="email" required class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="name@email.com" />
          <button type="submit" class="w-full rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800">Continuer par email</button>
        </form>
        <button class="w-full rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-gray-800" @click="() => signIn('credentials', { email: 'dev@example.com', callbackUrl: '/' })">Dev login (credentials)</button>
        <button class="w-full rounded-md border border-gray-300 px-4 py-2" @click="() => signIn('github')">GitHub</button>
        <button class="w-full rounded-md border border-gray-300 px-4 py-2" @click="() => signIn('google')">Google</button>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '#imports'

const email = ref('')
const { signIn } = useAuth()

async function signInEmail() {
  if (!email.value) return
  await signIn('email', { email: email.value, redirect: true, callbackUrl: '/' })
}
</script>


