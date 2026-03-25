export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: true },
  nuxtSharp: {
    dir: 'assets',
    screens: {
      'xs': 320,
      'sm': 640,
      'md': 768,
      'lg': 1024,
      'xl': 1280,
      'xxl': 1536,
      '2xl': 1536,
    },
  },
})
