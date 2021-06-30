import { isObject } from '@vue/shared'
import { Directive } from '.'

export const text: Directive<Text> = ({ el, exp, get, effect }) => {
  effect(() => {
    el.data = toDisplayString(get())
  })
}

export const toDisplayString = (value: any) =>
  value == null
    ? ''
    : isObject(value)
    ? JSON.stringify(value, null, 2)
    : String(value)
