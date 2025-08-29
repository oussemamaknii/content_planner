// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  pages: true,
  modules: [
    '@pinia/nuxt',
    ['@nuxtjs/tailwindcss', { cssPath: '@/assets/css/tailwind.css', configPath: 'tailwind.config.js' }],
    '@sidebase/nuxt-auth'
  ],
  css: ['@/assets/css/tailwind.css'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  }
})
