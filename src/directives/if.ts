import { Block } from '../block'
import { evaluate } from '../eval'
import { checkAttr } from '../utils'
import { Context } from '../walk'

interface Branch {
  exp?: string | null
  el: Element
}

export const _if = (el: Element, exp: string, ctx: Context) => {
  if (import.meta.env.DEV && !exp.trim()) {
    console.warn(`v-if expression cannot be empty.`)
  }

  const parent = el.parentElement!
  const anchor = new Comment('v-if')
  parent.insertBefore(anchor, el)

  const branches: Branch[] = [
    {
      exp,
      el
    }
  ]

  // locate else branch
  let elseEl: Element | null
  let elseExp: string | null
  while ((elseEl = el.nextElementSibling)) {
    elseExp = null
    if (
      checkAttr(elseEl, 'v-else') === '' ||
      (elseExp = checkAttr(elseEl, 'v-else-if'))
    ) {
      parent.removeChild(elseEl)
      branches.push({ exp: elseExp, el: elseEl })
    } else {
      break
    }
  }

  const nextNode = el.nextSibling
  parent.removeChild(el)

  let block: Block | undefined

  function removeActiveBlock() {
    if (block) {
      parent.insertBefore(anchor, block.el)
      block.remove()
      block = undefined
    }
  }

  ctx.effect(() => {
    for (const { exp, el } of branches) {
      if (!exp || evaluate(ctx.scope, exp)) {
        removeActiveBlock()
        block = new Block(el, ctx)
        block.insert(parent, anchor)
        parent.removeChild(anchor)
        return
      }
    }
    removeActiveBlock()
  })

  return nextNode
}
