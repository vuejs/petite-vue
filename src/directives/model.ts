import { isArray, looseEqual, looseIndexOf, toNumber } from '@vue/shared'
import { Directive } from './index'
import { listen } from '../utils'

// Consolidated value handling utilities
const createValueHandler = (resolveValue: (val: string) => any) =>
  (el: HTMLInputElement | HTMLTextAreaElement, assign: (val: any) => void) => {
    if ((el as any).composing) return
    assign(resolveValue(el.value))
  }

const setupInputHandlers = (el: Element, handlers: Record<string, EventListener>) => {
  Object.entries(handlers).forEach(([event, handler]) => {
    listen(el, event, handler)
  })
}

export const model: Directive<
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
> = ({ el, exp, get, effect, modifiers }) => {
  const type = el.type
  const assign = get(`(val) => { ${exp} = val }`)
  const { trim, number = type === 'number' || type === 'range' } = modifiers ?? {}

  if (el.tagName === 'SELECT') {
    const sel = el as HTMLSelectElement
    listen(el, 'change', () => {
      const selectedVal = Array.from(sel.options)
        .filter((o: HTMLOptionElement) => o.selected)
        .map((o: HTMLOptionElement) =>
          number ? toNumber(getValue(o)) : getValue(o)
        )
      assign(sel.multiple ? [...selectedVal] : selectedVal[0])
    })
    effect(() => {
      const value = get()
      const isMultiple = sel.multiple
      const options = sel.options
      for (let i = 0, l = options.length; i < l; i++) {
        const option = options[i]
        const optionValue = getValue(option)
        if (isMultiple) {
          if (isArray(value)) {
            option.selected = looseIndexOf(value, optionValue) > -1
          } else {
            option.selected = false
          }
        } else {
          if (looseEqual(optionValue, value)) {
            if (sel.selectedIndex !== i) sel.selectedIndex = i
            return
          }
        }
      }
      if (!isMultiple && sel.selectedIndex !== -1) {
        sel.selectedIndex = -1
      }
    })
  } else if (type === 'checkbox') {
    listen(el, 'change', () => {
      handleCheckboxChange(el as HTMLInputElement, get, assign)
    })

    let oldValue: any
    effect(() => {
      updateCheckboxValue(el as HTMLInputElement, get, oldValue)
      oldValue = get()
    })
  } else if (type === 'radio') {
    listen(el, 'change', () => {
      handleRadioChange(el as HTMLInputElement, assign)
    })
    let oldValue: any
    effect(() => {
      const value = get()
      if (value !== oldValue) {
        ; (el as HTMLInputElement).checked = looseEqual(value, getValue(el))
        oldValue = value
      }
    })
  } else {
    // text-like
    const resolveValue = (val: string) => {
      if (trim) return val.trim()
      if (number) return toNumber(val)
      return val
    }

    const handleInput = createValueHandler(resolveValue)
    const handlers: Record<string, EventListener> = {
      compositionstart: onCompositionStart,
      compositionend: onCompositionEnd,
      [modifiers?.lazy ? 'change' : 'input']: () =>
        handleInput(el as HTMLInputElement | HTMLTextAreaElement, assign)
    }

    if (trim) {
      handlers.change = () => {
        el.value = el.value.trim()
      }
    }

    setupInputHandlers(el, handlers)

    effect(() => {
      updateTextValue(el as HTMLInputElement | HTMLTextAreaElement, get, resolveValue)
    })
  }
}

const getValue = (el: any) => ('_value' in el ? el._value : el.value)

// retrieve raw value for true-value and false-value set via :true-value or :false-value bindings
const getCheckboxValue = (
  el: HTMLInputElement & { _trueValue?: any; _falseValue?: any },
  checked: boolean
) => {
  const key = checked ? '_trueValue' : '_falseValue'
  return key in el ? el[key] : checked
}

const onCompositionStart = (e: Event) => {
  ; (e.target as any).composing = true
}

export const onCompositionEnd = (e: Event) => {
  const target = e.target as any
  if (target.composing) {
    target.composing = false
    trigger(target, 'input')
  }
}

export const handleRadioChange = (
  el: HTMLInputElement,
  assign: (val: any) => void
) => {
  assign(getValue(el))
}

export const updateCheckboxValue = (
  el: HTMLInputElement,
  get: () => any,
  oldValue: any
) => {
  const value = get()
  if (isArray(value)) {
    el.checked = looseIndexOf(value, getValue(el)) > -1
  } else if (value !== oldValue) {
    el.checked = looseEqual(value, getCheckboxValue(el, true))
  }
}

// Re-export for backward compatibility with tests
export const handleTextInput = createValueHandler((val: string) => val)

export const handleCheckboxChange = (
  el: HTMLInputElement,
  get: () => any,
  assign: (val: any) => void
) => {
  const modelValue = get()
  const checked = el.checked
  if (isArray(modelValue)) {
    const elementValue = getValue(el)
    const index = looseIndexOf(modelValue, elementValue)
    const found = index !== -1
    if (checked && !found) {
      assign(modelValue.concat(elementValue))
    } else if (!checked && found) {
      const filtered = [...modelValue]
      filtered.splice(index, 1)
      assign(filtered)
    }
  } else {
    assign(getCheckboxValue(el, checked))
  }
}

export const updateTextValue = (
  el: HTMLInputElement | HTMLTextAreaElement,
  get: () => any,
  resolveValue: (val: string) => any
) => {
  if ((el as any).composing) {
    return
  }
  const curVal = el.value
  const newVal = get()
  if (document.activeElement === el && resolveValue(curVal) === newVal) {
    return
  }
  if (curVal !== newVal) {
    el.value = newVal
  }
}

const trigger = (el: HTMLElement, type: string) => {
  const e = document.createEvent('HTMLEvents')
  e.initEvent(type, true, true)
  el.dispatchEvent(e)
}
