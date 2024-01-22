import { Directive } from '.'
import {
  normalizeClass,
  normalizeStyle,
  isString,
  isArray,
  hyphenate,
  camelize
} from '@vue/shared'

const forceAttrRE = /^(spellcheck|draggable|form|list|type|onclick)$/

export const bind: Directive<Element & { _class?: string }> = ({
  el,
  get,
  effect,
  arg,
  modifiers
}) => {
  let prevValue: any

  // record static class
  // Update: Was checking if arg==="class", but that was false if bind to { class: }, so just storing no matter what for later use
  if (el.className) {
    el._class = el.className
  }

  effect(() => {
    let value = get()
    if (arg) {
      if (modifiers?.camel) {
        arg = camelize(arg)
      }
      setProp(el, arg, value, prevValue)
    } else {
      for (const key in value) {
        setProp(el, key, value[key], prevValue && prevValue[key])
      }
      for (const key in prevValue) {
        if (!value || !(key in value)) {
          setProp(el, key, null)
        }
      }
    }
    prevValue = value
  })
}

const setProp = (
  el: Element & { _class?: string },
  key: string,
  value: any,
  prevValue?: any
) => {
  if (key === 'class') {
    el.setAttribute(
      'class',
      normalizeClass(el._class ? [el._class, value] : value) || ''
    )
  } else if (key === 'style') {
    value = normalizeStyle(value)
    const { style } = el as HTMLElement
    if (!value) {
      el.removeAttribute('style')
    } else if (isString(value)) {
      if (value !== prevValue) style.cssText = value
    } else {
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
  } else if (
    !(el instanceof SVGElement) &&
    key in el &&
    !forceAttrRE.test(key)
  ) {
    // @ts-ignore
    el[key] = value
    if (key === 'value') {
      // @ts-ignore
      el._value = value
    }
  } else {
    // special case for <input v-model type="checkbox"> with
    // :true-value & :false-value
    // store value as dom properties since non-string values will be
    // stringified.
    if (key === 'true-value') {
      ;(el as any)._trueValue = value
    } else if (key === 'false-value') {
      ;(el as any)._falseValue = value
    } else if (value != null) {
      el.setAttribute(key, value)
    } else {
      el.removeAttribute(key)
    }
  }
}

const importantRE = /\s*!important$/

const setStyle = (
  style: CSSStyleDeclaration,
  name: string,
  val: string | string[]
) => {
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
        style[name as any] = val
      }
    }
  }
}
