import { Directive } from '.'

export const bind: Directive = ({ el, get, effect, arg }) => {
  effect(() => {
    // TODO modifiers
    // TODO class/style special handling
    const value = get()
    if (arg in el) {
      el[arg] = value
    } else {
      if (value != null) {
        el.setAttribute(arg, value)
      } else {
        el.removeAttribute(arg)
      }
    }
  })
}
