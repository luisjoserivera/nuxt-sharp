import { fileURLToPath } from 'node:url'
import {
  defineNuxtModule, addPlugin, createResolver,
  addImports,
  addTemplate,
  addServerHandler,
  addComponent,
  // addRouteMiddleware,
  // resolvePath,
  // useNitro,
} from '@nuxt/kit'
import { withoutTrailingSlash } from 'ufo'
// import _merge from 'lodash/merge'

export default defineNuxtModule({
  meta: {
    name: 'nuxt-sharp',
    configKey: 'nuxtSharp',
  },
  // Default configuration options of the Nuxt module
  defaults: nuxt => ({
    // namespace: "nsharpimg",
    // trailingSlashes: true,
    // forceLowercase: false,
    dir: nuxt.options.dir.public, // nuxt.options.dir.assets
    urlOptionKeySeparator: '_',
    urlModifiersSeparator: '_sharpMod',
    baseURL: '/_nsharp',
    // extensions: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'],
    format: ['webp'],
    // https://tailwindcss.com/docs/breakpoints
    screens: {
      'xs': 320,
      'sm': 640,
      'md': 768,
      'lg': 1024,
      'xl': 1280,
      'xxl': 1536,
      '2xl': 1536,
    },
    densities: [1, 2],
  }),
  setup(moduleOptions, nuxt) {
    const resolver = createResolver(import.meta.url)

    moduleOptions.dir = resolver.resolve(nuxt.options.srcDir, moduleOptions.dir)
    moduleOptions.densities = moduleOptions.densities || []
    moduleOptions.baseURL = moduleOptions.baseURL || '/_nsharp'

    const nuxtSharpOptions = moduleOptions
    nuxt.options.runtimeConfig.nuxtSharp = pick(nuxtSharpOptions, ['dir', 'baseURL', 'urlModifiersSeparator'])

    // const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
    const runtimeDir = resolver.resolve('./runtime')

    // nuxt.options.alias['#nuxtSharp'] = moduleDir
    nuxt.options.alias['#nuxtSharp'] = runtimeDir
    nuxt.options.build.transpile.push(runtimeDir)
    // nuxt.options.build.transpile.push('lodash')

    addTemplate({
      filename: 'nuxt-sharp-options.mjs',
      getContents() {
        return `
          export const nuxtSharpOptions = ${JSON.stringify(nuxtSharpOptions, null, 2)};
        `
      },
    })

    addImports({
      name: 'useSharp', // name of the composable to be used
      as: 'useSharp',
      // from: resolver.resolve(runtimeDir, 'composables/useSharp'), // path of composable
      from: resolver.resolve(runtimeDir, 'composables/useSharp'), // path of composable
    })

    // Add an API route
    addServerHandler({
      route: `${withoutTrailingSlash(moduleOptions.baseURL)}/**`,
      handler: resolver.resolve(runtimeDir, 'server'),
    })

    // Do not add the extension since the `.ts` will be transpiled to `.mjs` after `npm run prepack`
    addPlugin(resolver.resolve(runtimeDir, 'plugin'))

    addComponent({
      name: 'SharpImg',
      filePath: resolver.resolve(runtimeDir, 'components/sharp-img'),
    })
  },
})

function pick(obj, keys) {
  const newobj = {}
  for (const key of keys) {
    newobj[key] = obj[key]
  }
  return newobj
}
