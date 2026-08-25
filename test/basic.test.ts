import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('ssr', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
  })

  it('renders the index page', async () => {
    // Get response to a server-rendered page with `$fetch`.
    const html = await $fetch('/')
    expect(html).toContain('basic')
    expect(html).toContain('/_nsharp/quality-test.svg._sharpMod.q_20.webp')
  })

  it('applies quality to the generated image', async () => {
    const lowQuality = await $fetch<ArrayBuffer>(
      '/_nsharp/quality-test.svg._sharpMod.q_20.webp',
      { responseType: 'arrayBuffer' },
    )
    const highQuality = await $fetch<ArrayBuffer>(
      '/_nsharp/quality-test.svg._sharpMod.q_90.webp',
      { responseType: 'arrayBuffer' },
    )

    expect(Buffer.from(lowQuality)).not.toEqual(Buffer.from(highQuality))
    expect(lowQuality.byteLength).toBeLessThan(highQuality.byteLength)
  })

  it('rejects quality outside the supported range', async () => {
    await expect(
      $fetch('/_nsharp/quality-test.svg._sharpMod.q_101.webp'),
    ).rejects.toMatchObject({ statusCode: 400 })
  })
})
