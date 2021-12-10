import { Directive } from '.'
import { hyphenate } from '@vue/shared'
import { listen } from '../utils'
import { nextTick } from '../scheduler'

// same as vue 2
const simplePathRE =
  /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\['[^']*?']|\["[^"]*?"]|\[\d+]|\[[A-Za-z_$][\w$]*])*$/

const systemModifiers = ['ctrl', 'shift', 'alt', 'meta']

type KeyedEvent = KeyboardEvent | MouseEvent | TouchEvent

const modifierGuards: Record<
  string,
  (e: Event, modifiers: Record<string, true>) => void | boolean
> = {
  stop: (e) => e.stopPropagation(),
  prevent: (e) => e.preventDefault(),
  self: (e) => e.target !== e.currentTarget,
  ctrl: (e) => !(e as KeyedEvent).ctrlKey,
  shift: (e) => !(e as KeyedEvent).shiftKey,
  alt: (e) => !(e as KeyedEvent).altKey,
  meta: (e) => !(e as KeyedEvent).metaKey,
  left: (e) => 'button' in e && (e as MouseEvent).button !== 0,
  middle: (e) => 'button' in e && (e as MouseEvent).button !== 1,
  right: (e) => 'button' in e && (e as MouseEvent).button !== 2,
  exact: (e, modifiers) =>
    systemModifiers.some((m) => (e as any)[`${m}Key`] && !modifiers[m])
}

export const on: Directive = ({ el, get, exp, arg, modifiers }) => {
  if (!arg) {
    if (import.meta.env.DEV) {
      console.error(`v-on="obj" syntax is not supported in petite-vue.`)
    }
    return
  }

  let handler = simplePathRE.test(exp)
    ? get(`(e => ${exp}(e))`)
    : get(`($event => { ${exp} })`)

  // special lifecycle events
  if (import.meta.env.DEV && (arg === 'mounted' || arg === 'unmounted')) {
    console.error(
      `mounted and unmounted hooks now need to be prefixed with vue: ` +
        `- use @vue:${arg}="handler" instead.`
    )
  }
  if (arg === 'vue:mounted') {
    nextTick(handler)
    return
  } else if (arg === 'vue:unmounted') {
    return () => handler()
  }

  if (modifiers) {
    // map modifiers
    if (arg === 'click') {
      if (modifiers.right) arg = 'contextmenu'
      if (modifiers.middle) arg = 'mouseup'
    }

    const raw = handler
    handler = (e: Event) => {
      if ('key' in e && !(hyphenate((e as KeyboardEvent).key) in modifiers)) {
        return
      }
      for (const key in modifiers) {
        const guard = modifierGuards[key]
        if (guard && guard(e, modifiers)) {
          return
        }
      }
      return raw(e)
    }
  }

  listen(el, arg, handler, modifiers)
}
