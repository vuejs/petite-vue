import { reactive } from '@vue/reactivity'
import { Block } from './block'
import { Directive } from './directives'
import { createContext } from './walk'
import { toDisplayString } from './directives/text'

export const createApp = (initialData?: any) => {
  // root context
  const ctx = createContext()
  if (initialData) {
    ctx.scope = reactive(initialData)
  }

  // global internal helpers
  ctx.scope.$s = toDisplayString

  let rootBlocks: Block[]

  return {
    directive(name: string, def?: Directive) {
      if (def) {
        ctx.dirs[name] = def
        return this
      } else {
        return ctx.dirs[name]
      }
    },

    mount(el?: string | Element | null) {
      if (typeof el === 'string') {
        el = document.querySelector(el)
        if (!el) {
          import.meta.env.DEV &&
            console.error(`selector ${el} has no matching element.`)
          return
        }
      }

      el = el || document.documentElement
      let roots = el.hasAttribute('v-scope')
        ? [el]
        : // optimize whole page mounts: find all root-level v-scope
          [...el.querySelectorAll(`[v-scope]:not([v-scope] [v-scope])`)]
      if (!roots.length) {
        roots = [el]
      }

      if (
        import.meta.env.DEV &&
        roots.length === 1 &&
        roots[0] === document.documentElement
      ) {
        console.warn(
          `Mounting on documentElement - this is non-optimal as petite-vue ` +
            `will be forced to crawl the entire page's DOM. ` +
            `Consider explicitly marking elements controlled by petite-vue ` +
            `with \`v-scope\`.`
        )
      }

      rootBlocks = roots.map((el) => new Block(el, ctx, true))
      // remove all v-cloak after mount
      ;[el, ...el.querySelectorAll(`[v-cloak]`)].forEach((el) =>
        el.removeAttribute('v-cloak')
      )
      return this
    },

    unmount() {
      rootBlocks.forEach((block) => block.teardown())
    }
  }
}
