import { Context, createContext } from './context'
import { walk } from './walk'
import { remove } from '@vue/shared'
import { stop } from '@vue/reactivity'

export class Block {
  template: Element | DocumentFragment
  ctx: Context
  key?: any
  parentCtx?: Context

  isFragment: boolean
  start?: Text
  end?: Text

  get el() {
    return this.start || (this.template as Element)
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

    walk(this.template, this.ctx)
  }

  insert(parent: Element, anchor: Node | null = null) {
    if (this.isFragment) {
      if (this.start) {
        // already inserted, moving
        let node: Node | null = this.start
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
		try {
			// Possibly related to https://github.com/vuejs/petite-vue/discussions/188 , but at times (not always predictable, so not
			// sure what markup/order causes issue) a simple v-for="o in model.searchResultsResources" would cause an error when reactivity
			// was changing for searchResultsResources from an array with values to an empty array, parentNode was occasionally null.
			if (this.template.isConnected) {
				this.template.parentNode!.removeChild(this.template)
			}
		} catch (error) {
			console.log("petite-vue: Unable to remove template");
			console.log(error);
			console.log(this.template);
		}
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
