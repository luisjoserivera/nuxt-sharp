import { computed } from 'vue'
import { parseSize } from '../utils/index.js'
import { useSharp } from '#imports'

export const useBaseImage = (props) => {
  // console.log("useBaseImage", props);
  const options = computed(() => {
    return {
      preset: props.preset,
    }
  })
  const attrs = computed(() => {
    return {
      width: parseSize(props.width),
      height: parseSize(props.height),
      alt: props.alt,
      referrerpolicy: props.referrerpolicy,
      usemap: props.usemap,
      longdesc: props.longdesc,
      ismap: props.ismap,
      crossorigin:
        props.crossorigin === true ? 'anonymous' : props.crossorigin || void 0,
      loading: props.loading,
      decoding: props.decoding,
      nonce: props.nonce,
    }
  })
  const $img = useSharp()
  const modifiers = computed(() => {
    return {
      ...props.modifiers,
      width: parseSize(props.width),
      height: parseSize(props.height),
      format: props.format,
      quality: props.quality || $img.options.quality,
      background: props.background,
      fit: props.fit,
    }
  })
  return {
    options,
    attrs,
    modifiers,
  }
}
