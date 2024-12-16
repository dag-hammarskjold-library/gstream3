// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['dayjs-nuxt', '@nuxtjs/tailwindcss'],
  runtimeConfig: {
    //AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    //AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    //REGION: process.env.REGION,
    public: {
      // Override this with the environment variable NUXT_PUBLIC_GDOC_ENV
      GDOC_ENV: process.env.NUXT_PUBLIC_GDOC_ENV || 'prod'
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