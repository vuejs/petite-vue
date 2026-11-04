import type { Directive } from './types'

export const html: Directive = ({ el, get, effect }) => {
  effect(() => {
    el.innerHTML = get()
  })
}
