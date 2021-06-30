import { Block } from './block'
import { Directive } from './directives'
import { createContext } from './walk'

export function createApp() {
  // root context
  const ctx = createContext()
  let rootBlocks: Block[]

  return {
    data(key: string, value: any) {
      ctx.scope[key] = value
    },
    directive(name: string, def?: Directive) {
      if (def) {
        ctx.dirs[name] = def
      } else {
        return ctx.dirs[name]
      }
    },
    mount(el: string | Element) {
      el = (typeof el === 'string' ? document.querySelector(el) : el) as Element
      if (el) {
        const els = el.hasAttribute('v-data')
          ? [el]
          : // optimize whole page mounts: find all root-level v-data
            [...el.querySelectorAll(`[v-data]:not([v-data] [v-data])`)]
        rootBlocks = els.map((el) => new Block(el, ctx, true))
        // remove all v-cloak after mount
        ;[el, ...el.querySelectorAll(`[v-cloak]`)].forEach((el) =>
          el.removeAttribute('v-cloak')
        )
      } else {
        // TODO
      }
    },
    unmount() {
      rootBlocks.forEach((block) => block.teardown())
    }
  }
}
