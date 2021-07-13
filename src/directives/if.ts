import { Block } from '../block'
import { evaluate } from '../eval'
import { checkAttr } from '../utils'
import { Context } from '../context'

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

    const hasElse = checkAttr(elseEl, 'v-else') !== null
    if (hasElse) {
      elseExp = 'true'
    }
    
    const elseif = checkAttr(elseEl, 'v-else-if')
    if (elseif) {
      elseExp = elseif
    }

    if (elseExp) {
      parent.removeChild(elseEl)
      branches.push({ exp: elseExp, el: elseEl })
    }
    
    if (!elseif) {
      // Without elseif, the branch should not continue to spread
      break
    }
  }

  const nextNode = el.nextSibling
  parent.removeChild(el)

  let block: Block | undefined
  let activeBranchIndex: number = -1

  const removeActiveBlock = () => {
    if (block) {
      parent.insertBefore(anchor, block.el)
      block.remove()
      block = undefined
    }
  }

  ctx.effect(() => {
    for (let i = 0; i < branches.length; i++) {
      const { exp, el } = branches[i]
      if (!exp || evaluate(ctx.scope, exp)) {
        if (i !== activeBranchIndex) {
          removeActiveBlock()
          block = new Block(el, ctx)
          block.insert(parent, anchor)
          parent.removeChild(anchor)
          activeBranchIndex = i
        }
        return
      }
    }
    // no matched branch.
    activeBranchIndex = -1
    removeActiveBlock()
  })

  return nextNode
}
