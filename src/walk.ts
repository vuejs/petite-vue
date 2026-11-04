import { builtInDirectives } from './directives'
import type { Directive } from './directives/types'
import { _if } from './directives/if'
import { _for } from './directives/for'
import { bind } from './directives/bind'
import { on } from './directives/on'
import { text } from './directives/text'
import { evaluate } from './eval'
import { checkAttr, DIRECTIVE_PATTERNS } from './utils'
import { ref } from './directives/ref'
import { Context, createScopedContext } from './context'
import { setBlockWalker } from './block'
import { setInOnce } from './walkState'

// Use centralized regex patterns from utils
const dirRE = DIRECTIVE_PATTERNS.DIR_RE
const modifierRE = DIRECTIVE_PATTERNS.MODIFIER_RE

export const walk = (node: Node, ctx: Context): ChildNode | null | void => {
  const type = node.nodeType
  if (type === 1) {
    return walkElement(node as Element, ctx)
  }
  if (type === 3) {
    walkText(node as Text, ctx)
  } else if (type === 11) {
    walkChildren(node as DocumentFragment, ctx)
  }
}

setBlockWalker(walk)

const processElementDirectives = (el: Element, ctx: Context) => {
  const deferred: [string, string][] = []
  for (const { name, value } of Array.from(el.attributes)) {
    if (dirRE.test(name)) {
      if (name === 'v-model') {
        // defer v-model since it relies on :value bindings to be processed
        // first, but also before v-on listeners (#73)
        deferred.unshift([name, value])
      } else if (name[0] === '@' || name.startsWith('v-on')) {
        deferred.push([name, value])
      } else {
        processDirective(el, name, value, ctx)
      }
    }
  }
  for (const [name, value] of deferred) {
    processDirective(el, name, value, ctx)
  }
}

const walkElement = (el: Element, ctx: Context): ChildNode | null | void => {
  const parentCtx = ctx
  if (el.hasAttribute('v-pre')) {
    return
  }

  checkAttr(el, 'v-cloak')

  let exp: string | null

  // v-if
  if ((exp = checkAttr(el, 'v-if'))) {
    return _if(el, exp, ctx)
  }

  // v-for
  if ((exp = checkAttr(el, 'v-for'))) {
    return _for(el, exp, ctx)
  }

  // v-scope
  if ((exp = checkAttr(el, 'v-scope')) != null) {
    const scope = exp ? evaluate(ctx.scope, exp, el) : {}
    scope.$root = el
    ctx = createScopedContext(ctx, scope)
    if (scope.$template) {
      resolveTemplate(el, scope.$template)
    }
  }

  // v-once
  const hasVOnce = checkAttr(el, 'v-once') != null
  if (hasVOnce) {
    setInOnce(true)
  }

  // ref
  if ((exp = checkAttr(el, 'ref'))) {
    if (ctx !== parentCtx) {
      applyDirective(el, ref, exp, parentCtx)
    }
    applyDirective(el, ref, exp, ctx)
  }

  // process children first before self attrs
  walkChildren(el, ctx)

  // other directives
  processElementDirectives(el, ctx)

  if (hasVOnce) {
    setInOnce(false)
  }
}

const walkText = (node: Text, ctx: Context) => {
  const data = node.data
  if (!data.includes(ctx.delimiters[0])) {
    return
  }
  const segments: string[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = ctx.delimitersRE.exec(data))) {
    const leading = data.slice(lastIndex, match.index)
    if (leading) segments.push(JSON.stringify(leading))
    segments.push(`$s(${match[1]})`)
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < data.length) {
    segments.push(JSON.stringify(data.slice(lastIndex)))
  }
  applyDirective(node, text, segments.join('+'), ctx)
}

const walkChildren = (node: Element | DocumentFragment, ctx: Context) => {
  let child = node.firstChild
  while (child) {
    child = walk(child, ctx) ?? child.nextSibling
  }
}

const processDirective = (
  el: Element,
  raw: string,
  exp: string,
  ctx: Context
) => {
  let dir: Directive
  let arg: string | undefined
  let modifiers: Record<string, true> | undefined

  // modifiers
  raw = raw.replace(modifierRE, (_, m) => {
    (modifiers ??= {})[m] = true
    return ''
  })

  if (raw[0] === ':') {
    dir = bind
    arg = raw.slice(1)
  } else if (raw[0] === '@') {
    dir = on
    arg = raw.slice(1)
  } else {
    let dirName: string
    ;[dirName, arg] = raw.slice(2).split(':')
    dir = builtInDirectives[dirName] ?? ctx.dirs[dirName]
  }
  if (dir) {
    if (dir === bind && arg === 'ref') dir = ref
    applyDirective(el, dir, exp, ctx, arg, modifiers)
    el.removeAttribute(raw)
  } else if (import.meta.env.DEV) {
    console.error(`unknown custom directive ${raw}.`)
  }
}

const applyDirective = (
  el: Node,
  dir: Directive<any>,
  exp: string,
  ctx: Context,
  arg?: string,
  modifiers?: Record<string, true>
) => {
  const get = (e = exp) => evaluate(ctx.scope, e, el as Element)
  const cleanup = dir({
    el,
    get,
    effect: ctx.effect,
    ctx,
    exp,
    ...(arg !== undefined && { arg }),
    ...(modifiers && { modifiers })
  })
  if (cleanup) {
    ctx.cleanups.push(cleanup)
  }
}

const resolveTemplate = (el: Element, template: string) => {
  if (template[0] === '#') {
    const templateEl = document.querySelector(template)
    if (import.meta.env.DEV && !templateEl) {
      console.error(
        `template selector ${template} has no matching <template> element.`
      )
    }
    if (templateEl) {
      el.appendChild((templateEl as HTMLTemplateElement).content.cloneNode(true))
    }
    return
  }
  el.innerHTML = template.replace(/<\/?template\s*>/ig, '')
}
