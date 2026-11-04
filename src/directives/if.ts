import { Block } from '../block'
import { evaluate } from '../eval'
import { checkAttr } from '../utils'
import { Context } from '../context'

interface Branch {
  exp?: string | null
  el: Element
}

const collectBranches = (
  el: Element,
  exp: string,
  parent: Element | DocumentFragment
): Branch[] => {
  const branches: Branch[] = [{ exp, el }]
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
  return branches
}

const createBranchController = (
  branches: Branch[],
  ctx: Context,
  parent: Element | DocumentFragment,
  anchor: Comment
) => {
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
      if (exp == null || evaluate(ctx.scope, exp, el)) {
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
    activeBranchIndex = -1
    removeActiveBlock()
  })
}

export const _if = (el: Element, exp: string, ctx: Context) => {
  if (import.meta.env.DEV && !exp.trim()) {
    console.warn(`v-if expression cannot be empty.`)
  }

  const parent = el.parentElement ?? (el.parentNode as Element | DocumentFragment)
  if (!parent) return

  const anchor = new Comment('v-if')
  parent.insertBefore(anchor, el)

  const branches = collectBranches(el, exp, parent)
  const nextNode = el.nextSibling
  parent.removeChild(el)

  createBranchController(branches, ctx, parent, anchor)
  return nextNode
}
