import { reactive } from '@vue/reactivity'
import { Block } from './block'
import { Directive } from './directives'
import { walk, Context, createContext } from './walk'

export function createApp() {
  // root context
  const ctx = createContext()
  let rootBlock: Block

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
      el = typeof el === 'string' ? document.querySelector(el) : el
      if (el) {
        rootBlock = new Block(el, ctx, true)
        ;[el, ...el.querySelectorAll(`[v-cloak]`)].forEach((el) =>
          el.removeAttribute('v-cloak')
        )
      } else {
        // TODO
      }
    },
    unmount() {
      rootBlock.teardown()
    }
  }
}
