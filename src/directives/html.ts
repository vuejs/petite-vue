import { Directive } from '.'

export const html: Directive = ({ el, get, effect }) => {
  effect(() => {
    el.innerHTML = get()
  })
}
