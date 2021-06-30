import { Context, createContext, walk } from './walk'
import { remove } from '@vue/shared'
import { stop } from '@vue/reactivity'

export class Block {
  el: Element | DocumentFragment
  ctx: Context
  parentCtx?: Context

  isFragment: boolean
  start?: Text
  end?: Text

  constructor(template: Element, parentCtx: Context, isRoot = false) {
    this.isFragment = template instanceof HTMLTemplateElement

    if (isRoot) {
      this.el = template
    } else if (this.isFragment) {
      this.el = (template as HTMLTemplateElement).content.cloneNode(
        true
      ) as DocumentFragment
    } else {
      this.el = template.cloneNode(true) as Element
    }

    if (isRoot) {
      this.ctx = parentCtx
    } else {
      // create child context
      this.parentCtx = parentCtx
      parentCtx.blocks.push(this)
      this.ctx = createContext(parentCtx)
    }

    walk(this.el, this.ctx)
  }

  insert(parent: Element, anchor?: Node) {
    if (this.isFragment) {
      if (this.start) {
        // already inserted, moving
        let node: Node = this.start
        let next: Node | null
        while (node) {
          next = node.nextSibling
          parent.insertBefore(node, anchor)
          if (node === this.end) break
          node = next
        }
      } else {
        this.start = new Text('')
        this.end = new Text('')
        parent.insertBefore(this.end, anchor)
        parent.insertBefore(this.start, this.end)
        parent.insertBefore(this.el, this.end)
      }
    } else {
      parent.insertBefore(this.el, anchor)
    }
  }

  remove() {
    remove(this.parentCtx.blocks, this)
    if (this.start) {
      const parent = this.start.parentNode
      let node: Node = this.start
      let next: Node | null
      while (node) {
        next = node.nextSibling
        parent.removeChild(node)
        if (node === this.end) break
        node = next
      }
    } else {
      this.el.parentNode.removeChild(this.el)
    }
    this.teardown()
  }

  teardown() {
    this.ctx.blocks.forEach((child) => {
      child.teardown()
    })
    this.ctx.effects.forEach(stop)
    this.ctx.cleanups.forEach((fn) => fn())
  }
}
