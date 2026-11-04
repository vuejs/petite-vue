import { isObject } from '@vue/shared'
import type { Directive } from './types'

export const text: Directive<Text | Element> = ({ el, get, effect }) => {
  effect(() => {
    el.textContent = toDisplayString(get())
  })
}

export const toDisplayString = (value: any) =>
  value != null
    ? isObject(value)
      ? (() => {
        try {
          return JSON.stringify(value, null, 2)
        } catch (e) {
          return '[Object]'
        }
      })()
      : String(value)
    : ''
