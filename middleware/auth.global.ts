// @ts-nocheck
import { defineNuxtRouteMiddleware, navigateTo } from 'nuxt/app'

export default defineNuxtRouteMiddleware(async (to) => {
  if (process.server) {
    const { getServerSession } = await import('#auth')
    const isPublic = to.path === '/' || to.path.startsWith('/auth') || to.path.startsWith('/api')
    if (isPublic) return
    const session = await getServerSession()
    if (!session) return navigateTo('/auth/signin')
  }
})


