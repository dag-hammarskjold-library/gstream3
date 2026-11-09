// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['dayjs-nuxt', '@nuxtjs/tailwindcss', 'nuxt-mongoose', '@nuxt/test-utils/module'],
  runtimeConfig: {
    public: {
      version: "v0.3.0",
      gdocEnv: process.env.GDOC_ENV || 'prod'
    },
  },
  mongoose: {
    uri: process.env.NUXT_MONGOOSE_URI || process.env.MONGODB_URI
  },
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      title: 'Document System',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  }
})
