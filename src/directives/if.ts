import { effect } from '@vue/reactivity'
import { Block } from '../block'
import { evaluate } from '../eval'
import { Context } from '../walk'

export const _if = (el: Element, exp: string, ctx: Context) => {
  el.removeAttribute('v-if')

  const parent = el.parentNode
  const anchor = document.createComment('v-if')
  parent.insertBefore(anchor, el)
  // remove the original element for reuse as tempate
  parent.removeChild(el)

  let block: Block | undefined

  effect(() => {
    if (evaluate(ctx.scope, exp)) {
      if (!block) {
        block = new Block(el, ctx)
        parent.insertBefore(block.el, anchor)
        parent.removeChild(anchor)
      }
    } else {
      if (block) {
        block.teardown()
        parent.insertBefore(anchor, block.el)
        parent.removeChild(block.el)
        block = undefined
      }
    }
  })
}
