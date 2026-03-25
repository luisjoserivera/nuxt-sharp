/**
 *
 * @param {*} value
 * @returns
 */
export function parseColor(value) {
  // List of valid color names
  const colorNames = [
    'red',
    'green',
    'blue',
    'yellow',
    'black',
    'white',
    'gray',
    'purple',
    'orange',
    'pink',
    'brown',
    'cyan',
    'magenta',
  ]

  // Check if the value is in the list of color names
  if (colorNames.includes(value.toLowerCase())) {
    return value
  }

  // Regular expression for a valid hex color (3 or 6 characters)
  const hexPattern = /^[0-9A-F]{3}$|^[0-9A-F]{6}$/i

  // Check if the value matches the hex pattern
  if (hexPattern.test(value)) {
    return `#${value}`
  }

  // If neither, return an error message
  return null
}

export function parseSize(input = '') {
  if (typeof input === 'number') {
    return input
  }
  if (typeof input === 'string') {
    if (input.replace('px', '').match(/^\d+$/g)) {
      return Number.parseInt(input, 10)
    }
  }
}

export function parseSizes(input) {
  const sizes = {}
  if (typeof input === 'string') {
    for (const entry of input.split(/[\s,]+/).filter(e => e)) {
      const s = entry.split(':')
      if (s.length !== 2) {
        sizes['1px'] = s[0].trim()
      }
      else {
        sizes[s[0].trim()] = s[1].trim()
      }
    }
  }
  else {
    Object.assign(sizes, input)
  }
  return sizes
}

export function parseDensities(input = '') {
  if (input === void 0 || !input.length) {
    return []
  }
  const densities = /* @__PURE__ */ new Set()
  for (const density of input.split(' ')) {
    const d = Number.parseInt(density.replace('x', ''))
    if (d) {
      densities.add(d)
    }
  }
  return Array.from(densities)
}

export function checkDensities(densities) {
  if (densities.length === 0) {
    throw new Error(
      '`densities` must not be empty, configure to `1` to render regular size only (DPR 1.0)',
    )
  }
  if (import.meta.dev && Array.from(densities).some(d => d > 2)) {
    const _densities = densities
    if (!_densities._warned) {
      console.warn(
        '[nuxt] [SharpImg] Density values above `2` are not recommended. See https://observablehq.com/@eeeps/visual-acuity-and-device-pixel-ratio.',
      )
    }
    _densities._warned = true
  }
}
