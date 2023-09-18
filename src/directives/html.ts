import { nextTick } from '../scheduler'
import { Directive } from '.'

export const html: Directive = ({ el, modifiers, get, effect }) => {
  effect(() => {
    el.innerHTML = get()
    if (modifiers?.script) {
      nextTick(() => {
        const cs = el.querySelectorAll('script')
        for (const oldScript of cs) {
          const newScript = document.createElement('script')
          oldScript.type && (newScript.type = oldScript.type)
          oldScript.src && (newScript.src = oldScript.src)
          oldScript.text && (newScript.text = oldScript.text)
          oldScript.parentElement?.insertBefore(newScript, oldScript)
          oldScript.remove()
        }
      })
    }
  })
}
