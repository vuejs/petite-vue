import { effect } from '@vue/reactivity'
import { Directive } from '.'
import { evaluate } from '../eval'

export const html: Directive = (el, { scope }, value) => {
  effect(() => {
    el.innerHTML = evaluate(scope, value)
  })
}
