import fs from 'node:fs'
import path from 'node:path'
import { withTrailingSlash } from 'ufo'
import sharp from 'sharp'
import { defineEventHandler, setHeader, sendStream } from 'h3'
import { sharpConfigStringKeys, sharpStringKeyToValueSeparator } from './settings.js'
import { parseColor } from './utils/index.js'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const { req, res } = event.node

  try {
    const runtimeConfig = useRuntimeConfig()

    const moduleConfig = runtimeConfig.nuxtSharp || {}
    // console.log('moduleConfig', moduleConfig)

    const imageConfig = sharpConfigFromUrl(req.url)
    // console.log('imageConfig', imageConfig)

    // const absPath = path.resolve(
    //   process.cwd(),
    //   path.join("assets", imageConfig.filePath),
    // );

    const absPath = path.resolve(moduleConfig.dir, imageConfig.filePath)
    // console.log("absPath", absPath);

    if (!absPath) {
      throw new Error('Invalid file path')
    }

    // Check if the file exists
    if (!fs.existsSync(absPath)) {
      res.statusCode = 404
      res.end(`File not found: ${absPath}`)
      return
    }

    setHeader(event, 'Content-Type', imageConfig.type)

    const readStream = fs.createReadStream(absPath)

    readStream.on('error', (err) => {
      console.error(`Error reading file: ${err.message}`)
      res.statusCode = 500
      res.end(`Error reading file: ${err.message}`)
    })

    const { extFinal, extOriginal } = imageConfig

    if (extFinal === 'svg' && extFinal === extOriginal) {
      await sendStream(event, readStream)
    }
    else {
      let transform = sharp()
      if (imageConfig.options) {
        transform = sharpApplyOptions(transform, imageConfig.options)
      }

      const transformedStream = readStream.pipe(transform)

      transformedStream.on('error', (err) => {
        console.error(`Error processing image: ${err.message}`)
        res.statusCode = 500
        res.end(`Internal Server Error: ${err.message}`)
      })

      await sendStream(event, transformedStream)
    }
  }
  catch (error) {
    console.error(`Error handling request: ${error.message}`)
    res.statusCode = 400
    res.end(`Bad Request: ${error.message}`)
  }
})

/**
 *
 * @param {*} url
 * @returns
 */
function sharpConfigFromUrl(url) {
  // const parts = url.split("/_sharp/").pop().split("._sharpMod.");
  const moduleConfig = useRuntimeConfig().nuxtSharp || {}
  const baseUrl = withTrailingSlash(moduleConfig.baseURL)
  const parts = url
    .split(baseUrl)
    .pop()
    .split(`.${moduleConfig.urlModifiersSeparator}.`)
  // console.log("parts", parts);
  const filePath = parts[0]
  const extOriginal = filePath.split('.').pop()
  const extFinal = url.split('.').pop()
  const optString = parts[1] ? parts[1].replace(`.${extFinal}`, ``) : null
  const options = sharpConfigStringParser(optString)
  if (options?.background) {
    options.background = parseColor(options.background)
  }
  if (extFinal !== extOriginal) {
    options.format = extFinal
  }
  const config = {
    parts,
    filePath,
    extOriginal,
    extFinal,
    optString,
    options,
  }
  config.type = `image/${extFinal}`
  if (extFinal === 'svg') {
    config.type += `+xml`
  }
  return config
}

/**
 *
 * @param {*} optString
 * @returns
 */
function sharpConfigStringParser(optString) {
  if (!optString || typeof optString !== 'string' || optString === 'original') {
    return {}
  }

  const options = {}
  let parts = optString.split(',')
  const separator = sharpStringKeyToValueSeparator
  const modifierShorthands = sharpConfigStringKeys

  parts = parts.map(part => part.split(separator))
  parts.forEach((pockets) => {
    if (pockets.length < 2) return
    for (const key in modifierShorthands) {
      if (pockets[0] === modifierShorthands[key].shortName) {
        if (modifierShorthands[key].type === Number) {
          options[key] = Number.parseInt(pockets[1])
        }
        else {
          options[key] = pockets[1]
        }
      }
    }
  })
  return options
}

/**
 *
 * @param {*} transform   Sharp object
 * @param {*} options     Sharp options
 * @returns               Sharp object with options applied
 */
function sharpApplyOptions(transform, options) {
  const { width, height } = options

  if (width || height) {
    transform.resize(width, height)
  }

  if (options.background) {
    transform.flatten({ background: options.background })
  }

  if (options.format) {
    transform.toFormat(options.format)
  }

  return transform
}
