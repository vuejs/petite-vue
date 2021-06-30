import { reactive } from '@vue/reactivity'
import { Directive } from './directives'
import { walk } from './walk'

export interface Context {
  scope: Record<string, any>
  dirs: Record<string, Directive>
}

export function createApp() {
  const ctx: Context = {
    scope: reactive({}),
    dirs: {}
  }
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
        walk(el, ctx)
        ;[el, ...el.querySelectorAll(`[v-cloak]`)].forEach((el) =>
          el.removeAttribute('v-cloak')
        )
      } else {
        // TODO
      }
    }
  }
}
