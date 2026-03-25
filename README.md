# `@clickable/nuxt-img`

Sharp-powered image module for Nuxt.

This module adds:

- a `SharpImg` component
- a `useSharp()` composable
- a server endpoint that transforms local images with `sharp`

It is designed for local project images and responsive image URLs generated inside your Nuxt app.

## Install

```bash
npm install @clickable/nuxt-img
```

Then register the module in your Nuxt config:

```ts
export default defineNuxtConfig({
  modules: ['@clickable/nuxt-img'],
})
```

## Quick Start

Place your images in `public/` by default, or point the module to another local directory.

```vue
<template>
  <SharpImg
    src="/cover.png"
    width="320"
    background="green"
    alt="Cover image"
  />
</template>
```

You can also generate URLs manually:

```vue
<script setup>
const $img = useSharp()

const coverUrl = $img('/cover.png', {
  width: 640,
  background: 'white',
  format: 'webp',
})
</script>
```

## Configuration

```ts
export default defineNuxtConfig({
  modules: ['@clickable/nuxt-img'],
  nuxtSharp: {
    dir: 'assets',
    baseURL: '/_nsharp',
    urlModifiersSeparator: '_sharpMod',
    densities: [1, 2],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
      '2xl': 1536,
    },
  },
})
```

Current defaults:

- `dir`: `public`
- `baseURL`: `/_nsharp`
- `urlModifiersSeparator`: `_sharpMod`
- `format`: `['webp']`
- `densities`: `[1, 2]`

## Supported Image Modifiers

These modifiers are currently implemented end-to-end:

- `width`
- `height`
- `background`
- `format`

Example:

```vue
<template>
  <SharpImg
    src="/cover.png"
    width="400"
    height="240"
    format="webp"
    background="white"
    alt="Example image"
  />
</template>
```

## Responsive Images

`SharpImg` can generate `sizes` and `srcset` values using the configured breakpoints and densities.

```vue
<template>
  <SharpImg
    src="/cover.png"
    width="1200"
    height="675"
    sizes="xs:100vw md:768px xl:1200px"
    alt="Responsive cover"
  />
</template>
```

## Notes For This Release

- The module serves and transforms local files only.
- The first release intentionally documents only the modifiers that are already implemented.
- Some props exist in the component API for future expansion, but they are not yet part of the documented contract for this release.

## Deployment Note

`sharp` is a native dependency and must be installed for the target runtime platform.
If you deploy your Nuxt app to Linux, build and install dependencies in a Linux environment instead of copying `node_modules` from macOS.

## Development

```bash
npm install
npm run dev:prepare
npm run dev
```

Useful commands:

```bash
npm run lint
npm run test
npm run test:types
```

Formatting and style are enforced by the repository config.
Use the workspace Prettier and ESLint settings from this project so format-on-save matches `npm run lint`.
