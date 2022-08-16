import { isArray, looseEqual, looseIndexOf, toNumber } from '@vue/shared'
import { Directive } from '.'
import { listen } from '../utils'

export const model: Directive<
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
> = ({ el, exp, get, effect, modifiers }) => {
  const type = el.type
  const assign = get(`(val) => { ${exp} = val }`)
  const { trim, number = type === 'number' || type === 'range' } = modifiers || {}

  if (el.tagName === 'SELECT') {
    const sel = el as HTMLSelectElement
    listen(el, 'change', () => {
      const selectedVal = Array.prototype.filter
        .call(sel.options, (o: HTMLOptionElement) => o.selected)
        .map((o: HTMLOptionElement) =>
          number ? toNumber(getValue(o)) : getValue(o)
        )
      assign(sel.multiple ? selectedVal : selectedVal[0])
    })
    effect(() => {
      const value = get()
      const isMultiple = sel.multiple
      for (let i = 0, l = sel.options.length; i < l; i++) {
        const option = sel.options[i]
        const optionValue = getValue(option)
        if (isMultiple) {
          if (isArray(value)) {
            option.selected = looseIndexOf(value, optionValue) > -1
          } else {
            option.selected = value.has(optionValue)
          }
        } else {
          if (looseEqual(getValue(option), value)) {
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
      const modelValue = get()
      const checked = (el as HTMLInputElement).checked
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
        assign(getCheckboxValue(el as HTMLInputElement, checked))
      }
    })

    let oldValue: any
    effect(() => {
      const value = get()
      if (isArray(value)) {
        ;(el as HTMLInputElement).checked =
          looseIndexOf(value, getValue(el)) > -1
      } else if (value !== oldValue) {
        ;(el as HTMLInputElement).checked = looseEqual(
          value,
          getCheckboxValue(el as HTMLInputElement, true)
        )
      }
      oldValue = value
    })
  } else if (type === 'radio') {
    listen(el, 'change', () => {
      assign(getValue(el))
    })
    let oldValue: any
    effect(() => {
      const value = get()
      if (value !== oldValue) {
        ;(el as HTMLInputElement).checked = looseEqual(value, getValue(el))
      }
    })
  } else {
    // text-like
    const resolveValue = (val: string) => {
      if (trim) return val.trim()
      if (number) return toNumber(val)
      return val
    }

    listen(el, 'compositionstart', onCompositionStart)
    listen(el, 'compositionend', onCompositionEnd)
    listen(el, modifiers?.lazy ? 'change' : 'input', () => {
      if ((el as any).composing) return
      assign(resolveValue(el.value))
    })
    if (trim) {
      listen(el, 'change', () => {
        el.value = el.value.trim()
      })
    }

    effect(() => {
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
  ;(e.target as any).composing = true
}

const onCompositionEnd = (e: Event) => {
  const target = e.target as any
  if (target.composing) {
    target.composing = false
    trigger(target, 'input')
  }
}

const trigger = (el: HTMLElement, type: string) => {
  const e = document.createEvent('HTMLEvents')
  e.initEvent(type, true, true)
  el.dispatchEvent(e)
}
