// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['dayjs-nuxt', '@nuxtjs/tailwindcss', 'nuxt-mongoose', '@nuxt/test-utils/module'],
  runtimeConfig: {
    AwsAcessKeyId: process.env.AWS_ACCESS_KEY_ID || 'none',
    AwsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'none',
    public: {
      version: "v0.1.11",
      gdocEnv: process.env.GDOC_ENV || 'prod'
    },
  },
  mongoose: {
    uri: process.env.MONGODB_URI
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