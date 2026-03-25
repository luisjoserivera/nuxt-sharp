import { joinURL, hasProtocol, withLeadingSlash, cleanDoubleSlashes } from 'ufo'
// import { appendHeader } from "h3";
// import { useRequestEvent } from "#imports";

import {
  parseSize,
  parseSizes,
  parseDensities,
  checkDensities,
} from '../utils/index.js'

import {
  sharpConfigStringKeys,
  sharpStringKeyToValueSeparator,
} from '../settings.js'

// import {
//   sharpConfigStringKeys,
//   // sharpStringKeyToValueSeparator,
// } from "#nuxtSharp/runtime";

import { prerenderStaticImages } from '../utils/prerender.js'
import { useNuxtApp } from '#imports'
import { nuxtSharpOptions } from '#build/nuxt-sharp-options'

export const useSharp = () => {
  const nuxtApp = useNuxtApp()
  return (
    nuxtApp.$nuxtSharp
    || nuxtApp._nuxtSharp
    || (nuxtApp._nuxtSharp = createImage())
  )
}

function createImage() {
  const ctx = {
    options: nuxtSharpOptions,
  }
  const getImage = (imgSrc, imgOptions = {}) => {
    const image = resolveImage(ctx, imgSrc, imgOptions)
    if (import.meta.server && process.env.prerender) {
      prerenderStaticImages(image.url)
    }
    return image
  }
  const $nuxtSharp = (imgSrc, imgOptions) => {
    const newImage = getImage(imgSrc, imgOptions)
    // console.log("nuxtSharpOptions", nuxtSharpOptions);
    return newImage.url
  }
  $nuxtSharp.options = nuxtSharpOptions
  $nuxtSharp.getImage = getImage
  // $nuxtSharp.getMeta = (imgSrc, imgOptions) => getMeta(ctx, imgSrc, imgOptions);
  $nuxtSharp.getSizes = (imgSrc, imgOptions) =>
    getSizes(ctx, imgSrc, imgOptions)
  ctx.$nuxtSharp = $nuxtSharp
  ctx.$img = $nuxtSharp
  return $nuxtSharp
}

/**
 *
 */
function resolveImage(ctx, imgSrc, imgOptions) {
  if (imgSrc && typeof imgSrc !== 'string') {
    throw new TypeError(
      `imgSrc must be a string (received ${typeof imgSrc}: ${JSON.stringify(imgSrc)})`,
    )
  }
  if (!imgSrc || imgSrc.startsWith('data:')) {
    return {
      url: imgSrc,
    }
  }
  imgSrc = cleanDoubleSlashes(imgSrc)
  imgSrc = hasProtocol(imgSrc) ? imgSrc : withLeadingSlash(imgSrc)
  let modifiers = null

  if (imgOptions) {
    const parts = []
    for (const mod in sharpConfigStringKeys) {
      if (!{}.hasOwnProperty.call(imgOptions, mod)) continue
      if (!imgOptions[mod]) continue
      if (mod === 'format') continue
      const part
        = sharpConfigStringKeys[mod].shortName
        + sharpStringKeyToValueSeparator
        + `${imgOptions[mod]}`
      // console.log("mod:", mod, part);
      parts.push(part)
    }
    if (parts.length) {
      modifiers = parts.join(',')
    }
  }

  const fileExt = imgSrc.split('.').pop()
  const format = imgOptions?.format || fileExt

  const nameParts = [imgSrc]
  if (fileExt !== 'svg') {
    nameParts.push(nuxtSharpOptions.urlModifiersSeparator)
    nameParts.push(modifiers || 'original')
    nameParts.push(format)
  }
  // console.log("nameParts", nameParts);
  const newName = nameParts.join('.')

  const newUrl = joinURL(nuxtSharpOptions.baseURL, newName)
  // console.log('newUrl', newUrl)

  const image = {
    src: imgSrc,
    options: imgOptions,
    ext: fileExt,
    name: newName,
    format,
    url: newUrl,
  }

  // console.log("resolveImage", { imgSrc, imgOptions, modifiers, image });

  return image
}

// async function getMeta(ctx, input, options) {
//   const image = resolveImage(ctx, input, { ...options })
//   if (typeof image.getMeta === 'function') {
//     return await image.getMeta()
//   }
//   else {
//     return await imageMeta(ctx, image.url)
//   }
// }

function getSizes(ctx, input, opts) {
  const width = parseSize(opts.modifiers?.width)
  const height = parseSize(opts.modifiers?.height)
  const sizes = parseSizes(opts.sizes)

  const densities = opts.densities?.trim()
    ? parseDensities(opts.densities.trim())
    : ctx.options.densities

  checkDensities(densities)

  const hwRatio = width && height ? height / width : 0

  const sizeVariants = []
  const srcsetVariants = []

  if (Object.keys(sizes).length >= 1) {
    for (const key in sizes) {
      const variant = getSizesVariant(
        key,
        String(sizes[key]),
        height,
        hwRatio,
        ctx,
      )
      if (variant === void 0) {
        continue
      }
      sizeVariants.push({
        size: variant.size,
        screenMaxWidth: variant.screenMaxWidth,
        media: `(max-width: ${variant.screenMaxWidth}px)`,
      })
      for (const density of densities) {
        srcsetVariants.push({
          width: variant._cWidth * density,
          src: getVariantSrc(ctx, input, opts, variant, density),
        })
      }
    }
    finaliseSizeVariants(sizeVariants)
  }
  else {
    for (const density of densities) {
      const key = Object.keys(sizes)[0]
      let variant = getSizesVariant(
        key,
        String(sizes[key]),
        height,
        hwRatio,
        ctx,
      )
      if (variant === void 0) {
        variant = {
          size: '',
          screenMaxWidth: 0,
          _cWidth: opts.modifiers?.width,
          _cHeight: opts.modifiers?.height,
        }
      }
      srcsetVariants.push({
        width: density,
        src: getVariantSrc(ctx, input, opts, variant, density),
      })
    }
  }
  finaliseSrcsetVariants(srcsetVariants)
  const defaultVariant = srcsetVariants[srcsetVariants.length - 1]
  const sizesVal = sizeVariants.length
    ? sizeVariants
      .map(v => `${v.media ? v.media + ' ' : ''}${v.size}`)
      .join(', ')
    : void 0
  const suffix = sizesVal ? 'w' : 'x'
  const srcsetVal = srcsetVariants
    .map(v => `${v.src} ${v.width}${suffix}`)
    .join(', ')

  const response = {
    sizes: sizesVal,
    srcset: srcsetVal,
    src: defaultVariant?.src,
  }

  // console.log("sharp-img > getSizes > ctx.options", ctx.options);
  // console.log("sharp-img > getSizes > opts", opts);
  // console.log("sharp-img > getSizes > sizes", sizes);
  // console.log("sharp-img > getSizes > densities", densities);
  // console.log("sharp-img > getSizes > hwRatio", hwRatio);
  // console.log("sharp-img > getSizes > defaultVariant", defaultVariant);
  // console.log("sharp-img > getSizes > sizesVal", sizesVal);
  // console.log("sharp-img > getSizes > suffix", suffix);
  // console.log("sharp-img > getSizes > srcsetVal", srcsetVal);
  // console.log("sharp-img > getSizes > response", response);
  return response
}

function getSizesVariant(key, size, height, hwRatio, ctx) {
  const screenMaxWidth
    = (ctx.options.screens && ctx.options.screens[key]) || Number.parseInt(key)
  const isFluid = size.endsWith('vw')
  if (!isFluid && /^\d+$/.test(size)) {
    size = size + 'px'
  }
  if (!isFluid && !size.endsWith('px')) {
    return void 0
  }
  let _cWidth = Number.parseInt(size)
  if (!screenMaxWidth || !_cWidth) {
    return void 0
  }
  if (isFluid) {
    _cWidth = Math.round((_cWidth / 100) * screenMaxWidth)
  }
  const _cHeight = hwRatio ? Math.round(_cWidth * hwRatio) : height
  return {
    size,
    screenMaxWidth,
    _cWidth,
    _cHeight,
  }
}

function getVariantSrc(ctx, input, opts, variant, density) {
  return ctx.$img(
    input,
    {
      ...opts.modifiers,
      width: variant._cWidth ? variant._cWidth * density : void 0,
      height: variant._cHeight ? variant._cHeight * density : void 0,
    },
    opts,
  )
}

function finaliseSizeVariants(sizeVariants) {
  sizeVariants.sort((v1, v2) => v1.screenMaxWidth - v2.screenMaxWidth)
  let previousMedia = null
  for (let i = sizeVariants.length - 1; i >= 0; i--) {
    const sizeVariant = sizeVariants[i]
    if (sizeVariant.media === previousMedia) {
      sizeVariants.splice(i, 1)
    }
    previousMedia = sizeVariant.media
  }
  for (let i = 0; i < sizeVariants.length; i++) {
    sizeVariants[i].media = sizeVariants[i + 1]?.media || ''
  }
}

function finaliseSrcsetVariants(srcsetVariants) {
  srcsetVariants.sort((v1, v2) => v1.width - v2.width)
  let previousWidth = null
  for (let i = srcsetVariants.length - 1; i >= 0; i--) {
    const sizeVariant = srcsetVariants[i]
    if (sizeVariant.width === previousWidth) {
      srcsetVariants.splice(i, 1)
    }
    previousWidth = sizeVariant.width
  }
}
