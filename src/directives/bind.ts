import { Directive } from '.'
import {
  normalizeClass,
  normalizeStyle,
  isString,
  isArray,
  hyphenate,
  camelize
} from '@vue/shared'

const forceAttrRE = /^(spellcheck|draggable|form|list|type)$/

export const bind: Directive<Element> = ({
  el,
  get,
  effect,
  arg,
  modifiers
}) => {
  let prevValue: any
  effect(() => {
    let value = get()
    if (modifiers?.camel) arg = camelize(arg)
    if (arg === 'class') {
      el.setAttribute('class', normalizeClass(value) || '')
    } else if (arg === 'style') {
      value = normalizeStyle(value)
      const { style } = el as HTMLElement
      if (isString(value)) {
        if (value !== prevValue) style.cssText = value
      } else if (value) {
        for (const key in value) {
          setStyle(style, key, value[key])
        }
        if (prevValue && !isString(prevValue)) {
          for (const key in prevValue) {
            if (value[key] == null) {
              setStyle(style, key, '')
            }
          }
        }
      }
    } else if (arg in el && !forceAttrRE.test(arg)) {
      el[arg] = value
    } else {
      if (value != null) {
        el.setAttribute(arg, value)
      } else {
        el.removeAttribute(arg)
      }
    }
    prevValue = value
  })
}

const importantRE = /\s*!important$/

function setStyle(
  style: CSSStyleDeclaration,
  name: string,
  val: string | string[]
) {
  if (isArray(val)) {
    val.forEach((v) => setStyle(style, name, v))
  } else {
    if (name.startsWith('--')) {
      // custom property definition
      style.setProperty(name, val)
    } else {
      if (importantRE.test(val)) {
        // !important
        style.setProperty(
          hyphenate(name),
          val.replace(importantRE, ''),
          'important'
        )
      } else {
        style[name] = val
      }
    }
  }
}
