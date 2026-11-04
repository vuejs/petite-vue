import { Context, createContext } from './context'
import { remove } from '@vue/shared'
import { stop } from '@vue/reactivity'

type Walker = (node: Node, ctx: Context) => ChildNode | null | void

let walker: Walker | undefined

export const setBlockWalker = (fn: Walker) => {
  walker = fn
}

export class Block {
  template: Element | DocumentFragment
  ctx: Context
  key?: any
  parentCtx?: Context

  isFragment: boolean
  start?: Text
  end?: Text

  get el(): Element | Text {
    return this.start ?? (this.template as Element)
  }

  constructor(template: Element, parentCtx: Context, isRoot = false) {
    this.isFragment = template instanceof HTMLTemplateElement

    if (isRoot) {
      this.template = template
    } else if (this.isFragment) {
      this.template = (template as HTMLTemplateElement).content.cloneNode(
        true
      ) as DocumentFragment
    } else {
      this.template = template.cloneNode(true) as Element
    }

    if (isRoot) {
      this.ctx = parentCtx
    } else {
      // create child context
      this.parentCtx = parentCtx
      parentCtx.blocks.push(this)
      this.ctx = createContext(parentCtx)
    }

    walker?.(this.template, this.ctx)
  }

  insert(parent: Element | DocumentFragment | Document, anchor: Node | null = null) {
    if (this.isFragment) {
      if (this.start) {
        // already inserted, moving
        const nodesToMove: Node[] = []
        let node: Node | null = this.start
        while (node) {
          nodesToMove.push(node)
          if (node === this.end) break
          node = node.nextSibling
        }
        // Insert them in reverse order to maintain visual order
        for (let i = nodesToMove.length - 1; i >= 0; i--) {
          parent.insertBefore(nodesToMove[i], anchor)
        }
      } else {
        this.start = new Text('')
        this.end = new Text('')
        parent.insertBefore(this.end, anchor)
        parent.insertBefore(this.start, this.end)
        parent.insertBefore(this.template, this.end)
      }
    } else {
      parent.insertBefore(this.template, anchor)
    }
  }

  remove() {
    if (this.parentCtx) {
      remove(this.parentCtx.blocks, this)
    }
    if (this.start) {
      const parent = this.start.parentNode!
      let node: Node | null = this.start
      let next: Node | null
      while (node) {
        next = node.nextSibling
        parent.removeChild(node)
        if (node === this.end) break
        node = next
      }
    } else {
      this.template.parentNode!.removeChild(this.template)
    }
    this.teardown()
  }

  /**
   * Cleanup all effects and child blocks
   * Enhanced with better error handling and cleanup callbacks
   */
  teardown() {
    // Teardown child blocks first (depth-first cleanup)
    this.ctx.blocks.forEach((child) => {
      try {
        child.teardown()
      } catch (e) {
        if (import.meta.env.DEV) {
          console.warn('Error tearing down child block:', e)
        }
      }
    })

    // Stop all reactive effects
    this.ctx.effects.forEach((effect) => {
      try {
        stop(effect)
      } catch (e) {
        if (import.meta.env.DEV) {
          console.warn('Error stopping effect:', e)
        }
      }
    })

    // Run cleanup callbacks
    this.ctx.cleanups.forEach((cleanup) => {
      try {
        cleanup()
      } catch (e) {
        if (import.meta.env.DEV) {
          console.warn('Error in cleanup callback:', e)
        }
      }
    })

    // Clear arrays to free memory
    this.ctx.blocks.length = 0
    this.ctx.effects.length = 0
    this.ctx.cleanups.length = 0
  }
}
