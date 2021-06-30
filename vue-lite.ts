import { reactive, effect } from '@vue/reactivity'

export { reactive, effect }

interface AppContext {
  scope: Record<string, any>
  dirs: Record<string, Directive>
}

export function createApp() {
  const ctx: AppContext = {
    scope: reactive({}),
    dirs: Object.create(baseDirs)
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
        process(el, ctx)
        ;[el, ...el.querySelectorAll(`[v-cloak]`)].forEach((el) =>
          el.removeAttribute('v-cloak')
        )
      } else {
        // TODO
      }
    }
  }
}

const dirRE = /^(?:v-|:|@)/
const interpolationRE = /\{\{([^]+?)\}\}/g

function process(node: Node, ctx: AppContext) {
  const type = node.nodeType
  if (type === 1) {
    const el = node as Element
    if (el.hasAttribute('v-pre')) {
      return
    }
    // data scope must be processed first
    const dataExp = el.getAttribute('v-data')
    if (dataExp) {
      ctx = data(ctx, dataExp)
      el.removeAttribute('v-data')
    }
    // element
    for (const { name, value } of [...el.attributes]) {
      if (dirRE.test(name) && name !== 'v-cloak') {
        applyDirective(el, name, value, ctx)
      }
    }
    // process children
    let child = el.firstChild
    while (child) {
      process(child, ctx)
      child = child.nextSibling
    }
  } else if (type === 3) {
    // text
    const data = (node as Text).data
    if (data.includes('{{')) {
      let segments: string[] = []
      let lastIndex = 0
      let match
      while ((match = interpolationRE.exec(data))) {
        segments.push(
          JSON.stringify(data.slice(lastIndex, match.index)),
          `(${match[1]})`
        )
        lastIndex = match.index + match[0].length
      }
      if (lastIndex < data.length - 1) {
        segments.push(JSON.stringify(data.slice(lastIndex)))
      }
      text(node as Text, ctx, segments.join('+'))
    }
  }
}

const modRE = /\.([\w-]+)/

function applyDirective(
  el: Element,
  raw: string,
  value: string,
  ctx: AppContext
) {
  let dir: Directive
  let arg: string | undefined
  let modifiers: Record<string, true> | undefined

  // modifiers
  let modMatch: RegExpExecArray | null = null
  while ((modMatch = modRE.exec(raw))) {
    ;(modifiers || (modifiers = {}))[modMatch[1]] = true
    raw = raw.slice(modMatch.index)
  }

  if (raw[0] === ':') {
    dir = bind
    arg = raw.slice(1)
  } else if (raw[0] === '@') {
    dir = on
    arg = raw.slice(1)
  } else {
    const argIndex = raw.indexOf(':')
    const dirName = argIndex > 0 ? raw.slice(2, argIndex) : raw.slice(2)
    dir = ctx.dirs[dirName]
    arg = argIndex > 0 ? raw.slice(argIndex + 1) : undefined
  }
  if (dir) {
    dir(el, ctx, value, arg, modifiers)
    el.removeAttribute(raw)
  } else {
    // TODO
  }
}

const evalCache: Record<string, Function> = Object.create(null)

function evaluate(scope: any, exp: string) {
  const fn =
    evalCache[exp] ||
    (evalCache[exp] = new Function(
      `__scope`,
      `with (__scope) { return (${exp}) }`
    ))
  return fn(scope)
}

function data(ctx: AppContext, exp: string): AppContext {
  const newScope = Object.create(ctx.scope)
  const ret = evaluate(ctx.scope, exp)
  const evaluated = typeof ret === 'function' ? ret() : ret
  return {
    ...ctx,
    scope: reactive(Object.assign(newScope, evaluated))
  }
}

type Directive<T = Element> = (
  el: T,
  ctx: AppContext,
  value: string,
  arg?: string,
  modifiers?: Record<string, true>
) => void

const bind: Directive = (el, { scope }, exp, arg, modifiers) => {
  effect(() => {
    // TODO modifiers
    // TODO class/style special handling
    const value = evaluate(scope, exp)
    if (arg in el) {
      el[arg] = value
    } else {
      if (value != null) {
        el.setAttribute(arg, value)
      } else {
        el.removeAttribute(arg)
      }
    }
  })
}

// same as vue 2
const simplePathRE =
  /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\['[^']*?']|\["[^"]*?"]|\[\d+]|\[[A-Za-z_$][\w$]*])*$/

const on: Directive = (el, { scope }, exp, arg, modifiers) => {
  const handler = simplePathRE.test(exp)
    ? evaluate(scope, `(e => ${exp}(e))`)
    : evaluate(scope, `($event => { ${exp} })`)
  // TODO more modifiers
  el.addEventListener(arg, handler, modifiers)
}

const _if: Directive = (el, { scope }, value) => {
  const parent = el.parentNode
  const anchor = new Comment('v-if')
  let isAttached = true
  effect(() => {
    if (evaluate(scope, value)) {
      if (!isAttached) {
        parent.insertBefore(el, anchor)
        parent.removeChild(anchor)
        isAttached = true
      }
    } else if (isAttached) {
      parent.insertBefore(anchor, el)
      parent.removeChild(el)
      isAttached = false
    }
  })
}

const _for: Directive = () => {}

const text: Directive<Text> = (el, { scope }, value) => {
  effect(() => {
    el.data = evaluate(scope, value)
  })
}

const html: Directive = (el, { scope }, value) => {
  effect(() => {
    el.innerHTML = evaluate(scope, value)
  })
}

const show: Directive<HTMLElement> = (el, { scope }, value) => {
  const initialDisplay = el.style.display
  effect(() => {
    el.style.display = evaluate(scope, value) ? initialDisplay : 'none'
  })
}

const model: Directive = () => {}

const baseDirs = {
  bind,
  on,
  if: _if,
  for: _for,
  model,
  text,
  html,
  show
}
