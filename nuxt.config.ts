// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: {enabled: true},

  runtimeConfig: {
      public: {
          baseURL: process.env.BASE_URL,
      },
  },

  css: [
      '~/assets/css/main.css',
      '~/assets/css/tailwind.css',
  ],

  modules: ['@nuxt/ui', '@nuxtjs/google-fonts'],

  googleFonts: {
      preload: true,
      prefetch: true,
      preconnect: true,
      families: {
          Poppins: true,
      },
  },

  colorMode: {
      preference: 'light',
      fallback: 'light',
  },

  compatibilityDate: '2025-01-04'
})