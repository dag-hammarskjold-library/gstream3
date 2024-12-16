// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['dayjs-nuxt', '@nuxtjs/tailwindcss'],
  runtimeConfig: {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || 'none',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || 'none',
    AWS_DEFAULT_REGION: process.env.AWS_DEFAULT_REGION || 'us-east-1',
    public: {
      GDOC_ENV: process.env.GDOC_ENV || 'prod'
    },
  },
  app: {
    head: {
      title: 'Document System',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  }
})