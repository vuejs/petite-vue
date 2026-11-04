import type { Directive } from './types'
import { listen } from '../utils'
import { nextTick } from '../scheduler'
import { applyModifiers, mapClickArg } from '../eventGuards'

// same as vue 2
const simplePathRE =
  /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\['[^']*?']|\["[^"]*?"]|\[\d+]|\[[A-Za-z_$][\w$]*])*$/

export const on: Directive = ({ el, get, exp, arg, modifiers }) => {
  if (!arg) {
    if (import.meta.env.DEV) {
      console.error(`v-on="obj" syntax is not supported in pocket-vue.`)
    }
    return
  }

  let handler = simplePathRE.test(exp)
    ? get(`(e => ${exp}(e))`)
    : get(`($event => { ${exp} })`)

  // special lifecycle events
  if (import.meta.env.DEV && (arg === 'mounted' || arg === 'unmounted')) {
    console.error(
      `mounted and unmounted hooks now need to be prefixed with vue: - use @vue:${arg}="handler" instead.`
    )
  }
  if (arg === 'vue:mounted') {
    nextTick(handler)
    return
  } else if (arg === 'vue:unmounted') {
    return () => handler()
  }

  if (modifiers) {
    arg = mapClickArg(arg, modifiers)
    handler = applyModifiers(handler, modifiers)
  }

  listen(el, arg, handler, modifiers)
}
