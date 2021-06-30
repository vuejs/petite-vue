import { Block } from '../block'
import { evaluate } from '../eval'
import { Context } from '../walk'

export const _if = (el: Element, exp: string, ctx: Context) => {
  el.removeAttribute('v-if')

  const parent = el.parentElement
  const anchor = document.createComment('v-if')
  parent.insertBefore(anchor, el)
  // remove the original element for reuse as tempate
  parent.removeChild(el)

  let block: Block | undefined

  ctx.effect(() => {
    if (evaluate(ctx.scope, exp)) {
      if (!block) {
        block = new Block(el, ctx)
        block.insert(parent, anchor)
        parent.removeChild(anchor)
      }
    } else {
      if (block) {
        parent.insertBefore(anchor, block.start || block.el)
        block.remove()
        block = undefined
      }
    }
  })
}
