import { Context, walk } from './walk'
import { remove } from '@vue/shared'
import { reactive, stop } from '@vue/reactivity'

export class Block {
  el: Element
  ctx: Context
  parentCtx?: Context

  constructor(template: Element, parentCtx: Context, isRoot = false) {
    this.el = isRoot
      ? template
      : ((template instanceof HTMLTemplateElement
          ? template.content
          : template
        ).cloneNode(true) as Element)

    if (isRoot) {
      this.ctx = parentCtx
    } else {
      // create child context
      this.parentCtx = parentCtx
      parentCtx.blocks.push(this)
      this.ctx = {
        ...parentCtx,
        effects: [],
        blocks: [],
        cleanups: []
      }
    }

    walk(this.el, this.ctx)
  }

  teardown(nested = false) {
    if (!nested && this.parentCtx) {
      remove(this.parentCtx.blocks, this)
    }
    this.ctx.blocks.forEach((child) => {
      child.teardown(true)
    })
    this.ctx.effects.forEach(stop)
    this.ctx.cleanups.forEach((fn) => fn())
  }
}
