import { Directive } from '.'

export const _if: Directive = ({ el, get, effect }) => {
  const parent = el.parentNode
  const anchor = new Comment('v-if')
  let isAttached = true
  effect(() => {
    if (get()) {
      if (!isAttached) {
        parent.insertBefore(el, anchor)
        parent.removeChild(anchor)
        isAttached = true
      }
    } else if (isAttached) {
      parent.insertBefore(anchor, el)
      parent.removeChild(el)
      isAttached = false
    }
  })
}
