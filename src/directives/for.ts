import { isArray, isObject } from '@vue/shared'
import { Block } from '../block'
import { evaluate } from '../eval'
import { Context } from '../walk'
import { createScopedContext } from './scope'

const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/
const forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/
const stripParensRE = /^\(|\)$/g
const destructureRE = /^[{[]\s*((?:[\w_$]+\s*,?\s*)+)[\]}]$/

interface ChildScope {
  ctx: Context
  key: any
}

type KeyToIndexMap = Map<any, number>

export const _for = (el: Element, exp: string, ctx: Context) => {
  const inMatch = exp.match(forAliasRE)
  if (!inMatch) {
    import.meta.env.DEV && console.warn(`invalid v-for expression: ${exp}`)
    return
  }

  const nextNode = el.nextSibling

  const parent = el.parentElement!
  const anchor = new Text('')
  parent.insertBefore(anchor, el)
  parent.removeChild(el)

  const sourceExp = inMatch[2].trim()
  let valueExp = inMatch[1].trim().replace(stripParensRE, '').trim()
  let destructureBindings: string[] | undefined
  let isArrayDestructure = false
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

  let match
  if ((match = valueExp.match(forIteratorRE))) {
    valueExp = valueExp.replace(forIteratorRE, '').trim()
    indexExp = match[1].trim()
    if (match[2]) {
      objIndexExp = match[2].trim()
    }
  }

  if ((match = valueExp.match(destructureRE))) {
    destructureBindings = match[1].split(',').map((s) => s.trim())
    isArrayDestructure = valueExp[0] === '['
  }

  let mounted = false
  let blocks: Block[]
  let scopes: ChildScope[]
  let keyToIndexMap: Map<any, number>

  const createChildScopes = (
    source: unknown
  ): [ChildScope[], KeyToIndexMap] => {
    const map: KeyToIndexMap = new Map()
    const scopes: ChildScope[] = []

    if (isArray(source)) {
      for (let i = 0; i < source.length; i++) {
        scopes.push(createScope(map, source[i], i))
      }
    } else if (typeof source === 'number') {
      for (let i = 0; i < source; i++) {
        scopes.push(createScope(map, i + 1, i))
      }
    } else if (isObject(source)) {
      let i = 0
      for (const key in source) {
        scopes.push(createScope(map, source[key], i++, key))
      }
    }

    return [scopes, map]
  }

  const createScope = (
    map: KeyToIndexMap,
    value: any,
    index: number,
    objKey?: string
  ): ChildScope => {
    const data: any = {}
    if (destructureBindings) {
      destructureBindings.forEach(
        (b, i) => (data[b] = value[isArrayDestructure ? i : b])
      )
    } else {
      data[valueExp] = value
    }
    if (objKey) {
      indexExp && (data[indexExp] = objKey)
      objIndexExp && (data[objIndexExp] = index)
    } else {
      indexExp && (data[indexExp] = index)
    }
    const childCtx = createScopedContext(ctx, data)
    const key = keyExp ? evaluate(childCtx.scope, keyExp) : index
    map.set(key, index)
    return {
      ctx: childCtx,
      key
    }
  }

  const mountBlock = ({ ctx, key }: ChildScope, ref: Node) => {
    const block = new Block(el, ctx)
    block.key = key
    block.insert(parent, ref)
    return block
  }

  ctx.effect(() => {
    const source = evaluate(ctx.scope, sourceExp)
    const prevKeyToIndexMap = keyToIndexMap
    ;[scopes, keyToIndexMap] = createChildScopes(source)
    if (!mounted) {
      blocks = scopes.map((s) => mountBlock(s, anchor))
      mounted = true
    } else {
      const nextBlocks: Block[] = []
      for (let i = 0; i < blocks.length; i++) {
        if (!keyToIndexMap.has(blocks[i].key)) {
          blocks[i].remove()
        }
      }

      let i = scopes.length
      while (i--) {
        const scope = scopes[i]
        const oldIndex = prevKeyToIndexMap.get(scope.key)
        const next = scopes[i + 1]
        const nextBlockOldIndex = next && prevKeyToIndexMap.get(next.key)
        const nextBlock =
          nextBlockOldIndex == null ? undefined : blocks[nextBlockOldIndex]
        if (oldIndex == null) {
          // new
          nextBlocks[i] = mountBlock(scope, nextBlock ? nextBlock.el : anchor)
        } else {
          // update
          const block = (nextBlocks[i] = blocks[oldIndex])
          Object.assign(block.ctx.scope, scope.ctx.scope)
          if (oldIndex !== i) {
            // moved
            if (blocks[oldIndex + 1] !== nextBlock) {
              block.insert(parent, nextBlock ? nextBlock.el : anchor)
            }
          }
        }
      }
      blocks = nextBlocks
    }
  })

  return nextNode
}
