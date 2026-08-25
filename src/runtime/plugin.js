import { defineNuxtPlugin, useSharp } from '#imports'

export default /** @type {import('nuxt/app').Plugin} */ (defineNuxtPlugin((nuxtApp) => {
  // Example of injecting a function using the options
  const nuxtSharp = useSharp()
  nuxtApp.provide('nuxtSharp', nuxtSharp)
}))
