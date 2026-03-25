// import { h, defineComponent, ref, computed, onMounted } from "vue";
import { h, computed, defineComponent } from 'vue'
import { parseSize } from '../utils/index.js'
import { prerenderStaticImages } from '../utils/prerender.js'
import { markFeatureUsage } from '../utils/performance.js'
import { useBaseImage } from './_base'
import { useNuxtApp, useHead, useSharp } from '#imports'

export default defineComponent({
  name: 'SharpImg',
  props: {
    // input source
    src: { type: String, default: void 0 },
    // modifiers
    format: { type: String, default: void 0 },
    quality: { type: [Number, String], default: void 0 },
    background: { type: String, default: void 0 },
    fit: { type: String, default: void 0 },
    modifiers: { type: Object, default: void 0 },
    // options
    preset: { type: String, default: void 0 },
    sizes: { type: [Object, String], default: void 0 },
    densities: { type: String, default: void 0 },
    preload: {
      type: [Boolean, Object],
      default: void 0,
    },
    // <img> attributes
    width: { type: [String, Number], default: void 0 },
    height: { type: [String, Number], default: void 0 },
    alt: { type: String, default: void 0 },
    referrerpolicy: { type: String, default: void 0 },
    usemap: { type: String, default: void 0 },
    longdesc: { type: String, default: void 0 },
    ismap: { type: Boolean, default: void 0 },
    loading: {
      type: String,
      default: void 0,
      validator: val => ['lazy', 'eager'].includes(val),
    },
    crossorigin: {
      type: [Boolean, String],
      default: void 0,
      validator: val =>
        ['anonymous', 'use-credentials', '', true, false].includes(val),
    },
    decoding: {
      type: String,
      default: void 0,
      validator: val => ['async', 'auto', 'sync'].includes(val),
    },
    // csp
    nonce: { type: [String], default: void 0 },
    placeholder: { type: [Boolean, String, Number, Array], default: void 0 },
    placeholderClass: { type: String, default: void 0 },
  },
  emits: ['load', 'error'],
  setup: (props, ctx) => {
    // console.log("sharp-img > ctx", ctx);
    const $img = useSharp()
    const _base = useBaseImage(props)
    // console.log("sharp-img > props", props);
    // console.log("sharp-img > _base.options", _base.options.value);
    // console.log("sharp-img > _base.attrs", _base.attrs.value);
    // console.log("sharp-img > _base.modifiers", _base.modifiers.value);
    const placeholderLoaded = ref(false)
    const imgEl = ref()

    const sizes = computed(() =>
      $img.getSizes(props.src, {
        ..._base.options.value,
        sizes: props.sizes,
        densities: props.densities,
        modifiers: {
          ..._base.modifiers.value,
          width: parseSize(props.width),
          height: parseSize(props.height),
        },
      }),
    )
    // console.log("sharp-img > sizes", sizes.value);

    const attrs = computed(() => {
      const attrs2 = { ..._base.attrs.value, 'data-sharp-img': '' }
      if (!props.placeholder || placeholderLoaded.value) {
        attrs2.sizes = sizes.value.sizes
        attrs2.srcset = sizes.value.srcset
      }
      return attrs2
    })
    // console.log("sharp-img > attrs", attrs.value);

    const placeholder = computed(() => {
      let placeholder2 = props.placeholder
      if (placeholder2 === '') {
        placeholder2 = true
      }
      if (!placeholder2 || placeholderLoaded.value) {
        return false
      }
      if (typeof placeholder2 === 'string') {
        return placeholder2
      }
      const size = Array.isArray(placeholder2)
        ? placeholder2
        : typeof placeholder2 === 'number'
          ? [placeholder2, placeholder2]
          : [10, 10]
      return $img(
        props.src,
        {
          ..._base.modifiers.value,
          width: size[0],
          height: size[1],
          quality: size[2] || 50,
          blur: size[3] || 3,
        },
        _base.options.value,
      )
    })
    // console.log("sharp-img > placeholder", placeholder.value);

    // console.log("sharp-img > _base", _base);

    const mainSrc = computed(() =>
      props.sizes
        ? sizes.value.src
        : $img(props.src, _base.modifiers.value, _base.options.value),
    )

    const src = computed(() =>
      placeholder.value ? placeholder.value : mainSrc.value,
    )

    if (props.preload) {
      const isResponsive = Object.values(sizes.value).every(v => v)
      useHead({
        link: [
          {
            rel: 'preload',
            as: 'image',
            nonce: props.nonce,
            ...(!isResponsive
              ? { href: src.value }
              : {
                  href: sizes.value.src,
                  imagesizes: sizes.value.sizes,
                  imagesrcset: sizes.value.srcset,
                }),
            ...(typeof props.preload !== 'boolean'
            && props.preload.fetchPriority
              ? { fetchpriority: props.preload.fetchPriority }
              : {}),
          },
        ],
      })
    }

    // console.log(
    //   "nuxt-img > prerenderStaticImages",
    //   src.value,
    //   sizes.value.srcset,
    // );
    if (import.meta.server && process.env.prerender) {
      prerenderStaticImages(src.value, sizes.value.srcset)
    }

    const nuxtApp = useNuxtApp()
    const initialLoad = nuxtApp.isHydrating

    onMounted(() => {
      if (placeholder.value) {
        const img = new Image()
        img.src = mainSrc.value
        if (props.sizes) {
          img.sizes = sizes.value.sizes || ''
          img.srcset = sizes.value.srcset
        }
        img.onload = (event) => {
          placeholderLoaded.value = true
          ctx.emit('load', event)
        }
        markFeatureUsage('sharp-image')
        return
      }
      if (!imgEl.value) {
        return
      }
      if (imgEl.value.complete && initialLoad) {
        if (imgEl.value.getAttribute('data-error')) {
          ctx.emit('error', new Event('error'))
        }
        else {
          ctx.emit('load', new Event('load'))
        }
      }
      imgEl.value.onload = (event) => {
        ctx.emit('load', event)
      }
      imgEl.value.onerror = (event) => {
        ctx.emit('error', event)
      }
    })

    return () =>
      h('img', {
        ref: imgEl,
        ...(import.meta.server
          ? { onerror: 'this.setAttribute(\'data-error\', 1)' }
          : {}),
        ...attrs.value,
        ...ctx.attrs,
        class:
          props.placeholder && !placeholderLoaded.value
            ? [props.placeholderClass]
            : void 0,
        src: src.value,
      })
  },
})
