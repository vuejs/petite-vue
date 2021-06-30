import { Context } from './app'
import { builtInDirectives, Directive } from './directives'
import { bind } from './directives/bind'
import { data } from './directives/data'
import { on } from './directives/on'
import { text } from './directives/text'
import { evaluate } from './eval'
import { effect as rawEffect } from '@vue/reactivity'

const dirRE = /^(?:v-|:|@)/
const modifierRE = /\.([\w-]+)/g
const interpolationRE = /\{\{([^]+?)\}\}/g

export function walk(node: Node, ctx: Context) {
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
        processDirective(el, name, value, ctx)
      }
    }
    // process children
    let child = el.firstChild
    while (child) {
      walk(child, ctx)
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
      applyDirective(node, text, segments.join('+'), ctx)
    }
  }
}

function processDirective(el: Element, raw: string, exp: string, ctx: Context) {
  let dir: Directive
  let arg: string | undefined
  let modifiers: Record<string, true> | undefined

  // modifiers
  let modMatch: RegExpExecArray | null = null
  while ((modMatch = modifierRE.exec(raw))) {
    ;(modifiers || (modifiers = {}))[modMatch[1]] = true
    raw = raw.slice(0, modMatch.index)
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
    dir = builtInDirectives[dirName] || ctx.dirs[dirName]
    arg = argIndex > 0 ? raw.slice(argIndex + 1) : undefined
  }
  if (dir) {
    applyDirective(el, dir, exp, ctx, arg, modifiers)
    el.removeAttribute(raw)
  } else {
    // TODO
  }
}

function applyDirective(
  el: Node,
  dir: Directive<any>,
  exp: string,
  ctx: Context,
  arg?: string,
  modifiers?: Record<string, true>
) {
  const get = (e = exp) => evaluate(ctx.scope, e, el)
  // TODO track this on current scope for teardown
  const effect: typeof rawEffect = (fn, options) => rawEffect(fn, options)
  dir({ el, get, effect, ctx, exp, arg, modifiers })
}
