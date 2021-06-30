import { Directive } from '.'

export const text: Directive<Text> = ({ el, get, effect }) => {
  effect(() => {
    el.data = get()
  })
}
