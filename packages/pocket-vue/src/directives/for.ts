import { isArray, isObject } from '@vue/shared'
import { Block } from '../block'
import { evaluate } from '../eval'
import { Context, createScopedContext } from '../context'
import { DIRECTIVE_PATTERNS } from '../utils'

// Use centralized regex patterns
const forAliasRE = DIRECTIVE_PATTERNS.FOR_ALIAS_RE
const forIteratorRE = DIRECTIVE_PATTERNS.FOR_ITERATOR_RE
const stripParensRE = DIRECTIVE_PATTERNS.STRIP_PARENS_RE
const destructureRE = DIRECTIVE_PATTERNS.DESTRUCTURE_RE

interface ParsedFor {
  sourceExp: string
  valueExp: string
  keyExp?: string
  indexExp?: string
  objIndexExp?: string
  destructureBindings?: string[]
  isArrayDestructure: boolean
}

const reconcileBlocks = (
  newChildCtxs: Context[],
  oldBlocks: Block[],
  el: Element
): { newBlocks: Block[]; unusedBlocks: Block[] } => {
  const newBlocks: Block[] = []
  const oldKeyToBlockMap: Map<any, Block> = new Map()

  oldBlocks.forEach((block) => {
    oldKeyToBlockMap.set(block.key, block)
  })

  for (let i = 0; i < newChildCtxs.length; i++) {
    const newChildCtx = newChildCtxs[i]
    const newKey = newChildCtx.key
    let block: Block | undefined

    if (newKey != null) {
      block = oldKeyToBlockMap.get(newKey)
      if (block) {
        Object.assign(block.ctx.scope, newChildCtx.scope)
        oldKeyToBlockMap.delete(newKey)
      }
    }

    if (!block) {
      block = new Block(el, newChildCtx)
      block.key = newKey
    }
    newBlocks[i] = block
  }

  return { newBlocks, unusedBlocks: Array.from(oldKeyToBlockMap.values()) }
}

const positionBlocks = (
  newBlocks: Block[],
  parent: Element,
  anchor: Node
) => {
  for (let i = newBlocks.length - 1; i >= 0; i--) {
    const block = newBlocks[i]
    const nextBlock = newBlocks[i + 1]
    const expectedNextEl = nextBlock ? nextBlock.el : anchor
    const blockEnd = block.isFragment ? block.end! : block.el
    const actualNextEl = blockEnd.nextSibling

    if (actualNextEl !== expectedNextEl) {
      block.insert(parent, expectedNextEl)
    }
  }
}

const updateBlocks = (
  newChildCtxs: Context[],
  oldBlocks: Block[],
  anchor: Node,
  parent: Element,
  el: Element
): Block[] => {
  const { newBlocks, unusedBlocks } = reconcileBlocks(
    newChildCtxs,
    oldBlocks,
    el
  )
  unusedBlocks.forEach((block) => block.remove())
  positionBlocks(newBlocks, parent, anchor)
  return newBlocks
}

const parseForExpression = (el: Element, inMatch: RegExpMatchArray): ParsedFor => {
  const sourceExp = inMatch[2]
  let valueExp = inMatch[1].trim().replace(stripParensRE, '').trim()
  let destructureBindings: string[] | undefined
  let indexExp: string | undefined
  let objIndexExp: string | undefined

  let keyAttr = 'key'
  let keyExp =
    el.getAttribute(keyAttr) ||
    el.getAttribute((keyAttr = ':key')) ||
    el.getAttribute((keyAttr = 'v-bind:key'))
  if (keyExp) {
    el.removeAttribute(keyAttr)
    if (keyAttr === 'key') keyExp = JSON.stringify(keyExp)
  }

  let match: RegExpMatchArray | null
  if ((match = valueExp.match(forIteratorRE))) {
    valueExp = valueExp.replace(forIteratorRE, '').trim()
    indexExp = match[1].trim()
    if (match[2]) {
      objIndexExp = match[2].trim()
    }
  }

  if ((match = valueExp.match(destructureRE))) {
    destructureBindings = match[1].split(',').map((s) => s.trim())
  }

  return {
    sourceExp,
    valueExp,
    keyExp: keyExp ?? undefined,
    indexExp,
    objIndexExp,
    destructureBindings,
    isArrayDestructure: valueExp[0] === '['
  }
}

const createItemScope = (
  parsed: ParsedFor,
  value: any,
  index: number,
  objKey?: string
) => {
  const data: any = {}
  if (parsed.destructureBindings) {
    parsed.destructureBindings.forEach(
      (b, i) => (data[b] = value[parsed.isArrayDestructure ? i : b])
    )
  } else {
    data[parsed.valueExp] = value
  }
  if (objKey) {
    parsed.indexExp && (data[parsed.indexExp] = objKey)
    parsed.objIndexExp && (data[parsed.objIndexExp] = index)
  } else {
    parsed.indexExp && (data[parsed.indexExp] = index)
  }
  return data
}

const createChildContexts = (
  source: unknown,
  ctx: Context,
  el: Element,
  parsed: ParsedFor
): Context[] => {
  const ctxs: Context[] = []

  const addChild = (value: any, index: number, objKey?: string) => {
    const data = createItemScope(parsed, value, index, objKey)
    const childCtx = createScopedContext(ctx, data)
    childCtx.key = parsed.keyExp
      ? evaluate(childCtx.scope, parsed.keyExp, el)
      : index
    ctxs.push(childCtx)
  }

  if (isArray(source)) {
    for (let i = 0; i < source.length; i++) {
      addChild(source[i], i)
    }
  } else if (typeof source === 'number') {
    for (let i = 0; i < source; i++) {
      addChild(i + 1, i)
    }
  } else if (isObject(source)) {
    let i = 0
    for (const key in source) {
      addChild(source[key], i++, key)
    }
  }

  return ctxs
}

export const _for = (el: Element, exp: string, ctx: Context) => {
  const inMatch = exp.match(forAliasRE)
  if (!inMatch) {
    if (import.meta.env.DEV) {
      console.warn(`invalid v-for expression: ${exp}`)
    }
    return
  }

  const nextNode = el.nextSibling
  const parent = el.parentElement!
  const anchor = new Text('')
  parent.insertBefore(anchor, el)
  parent.removeChild(el)

  const parsed = parseForExpression(el, inMatch)
  let mounted = false
  let blocks: Block[]
  let childCtxs: Context[]

  const mountBlock = (childCtx: Context) => {
    const block = new Block(el, childCtx)
    block.key = childCtx.key
    block.insert(parent, anchor)
    return block
  }

  ctx.effect(() => {
    const source = evaluate(ctx.scope, parsed.sourceExp, el)
    childCtxs = createChildContexts(source, ctx, el, parsed)
    if (!mounted) {
      blocks = childCtxs.map(mountBlock)
      mounted = true
    } else {
      blocks = updateBlocks(childCtxs, blocks, anchor, parent, el)
    }
  })

  return nextNode
}
