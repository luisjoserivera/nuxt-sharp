import { defineNuxtPlugin, useSharp } from '#imports'

export default defineNuxtPlugin((nuxtApp) => {
  // Example of injecting a function using the options
  const nuxtSharp = useSharp()
  nuxtApp.provide('nuxtSharp', nuxtSharp)
})
