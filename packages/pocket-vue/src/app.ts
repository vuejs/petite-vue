import { reactive } from '@vue/reactivity'
import { Block } from './block'
import './walk'
import { Directive } from './directives'
import { bindContextMethods, createContext, type Context } from './context'
import { toDisplayString } from './directives/text'
import { nextTick } from './scheduler'

const escapeRegex = (str: string) =>
  str.replace(/[-.*+?^${}()|[\]\/\\]/g, '\\$&')

/**
 * The main application interface for pocket-vue.
 */
export interface App {
  /** Registers a directive. */
  directive(name: string, def?: Directive): Directive | undefined | App
  /** Installs a plugin. */
  use(plugin: any, options?: any): App
  /** Mounts the application to the DOM. */
  mount(el?: string | Element | null): App | undefined
  /** Unmounts the application. */
  unmount(): void
  /** The root blocks of the mounted application. */
  readonly rootBlocks: Block[]
  /** The root scope/context of the application. */
  readonly scope: any
}

const initAppContext = (initialData?: any): Context => {
  const ctx = createContext()
  if (initialData) {
    ctx.scope = reactive(initialData)
    bindContextMethods(ctx.scope)

    if (initialData.$delimiters) {
      const [open, close] = (ctx.delimiters = initialData.$delimiters)
      ctx.delimitersRE = new RegExp(
        escapeRegex(open) + '([^]+?)' + escapeRegex(close),
        'g'
      )
    }
  }

  ctx.scope.$s = toDisplayString
  ctx.scope.$nextTick = nextTick
  ctx.scope.$refs = Object.create(null)
  return ctx
}

const resolveMountRoots = (
  el?: string | Element | null
): Element[] | undefined => {
  if (typeof el === 'string') {
    const selector = el
    el = document.querySelector(el)
    if (!el) {
      if (import.meta.env.DEV) {
        console.error(`selector ${selector} has no matching element.`)
      }
      return
    }
  }

  const root = el ?? document.documentElement
  let roots: Element[]
  if (root.hasAttribute('v-scope')) {
    roots = [root]
  } else {
    roots = [...root.querySelectorAll(`[v-scope]`)].filter(
      (node) => !node.matches(`[v-scope] [v-scope]`)
    )
    if (!roots.length) {
      roots = [root]
    }
  }

  if (import.meta.env.DEV && roots[0] === document.documentElement) {
    console.warn(
      `Mounting on documentElement - this is non-optimal as pocket-vue will be forced to crawl the entire page's DOM. Consider explicitly marking elements controlled by pocket-vue with \`v-scope\`.`
    )
  }
  return roots
}

/**
 * Creates a new pocket-vue application instance.
 * @param initialData - Optional initial state/data for the application.
 * @returns A new App instance.
 */
export const createApp = (initialData?: any): App => {
  const ctx = initAppContext(initialData)
  let rootBlocks: Block[]

  return {
    directive(name: string, def?: Directive) {
      if (def) {
        ctx.dirs[name] = def
        return this
      }
      return ctx.dirs[name]
    },

    use(plugin: any, options = {}) {
      plugin.install(this, options)
      return this
    },

    mount(el?: string | Element | null) {
      const roots = resolveMountRoots(el)
      if (!roots) return
      rootBlocks = roots.map((root) => new Block(root, ctx, true))
      return this
    },

    unmount() {
      rootBlocks?.forEach((block) => block.teardown())
    },

    get rootBlocks() {
      return rootBlocks
    },

    get scope() {
      return ctx.scope
    }
  }
}
