import { isArray, isObject } from '@vue/shared'
import { Block } from '../block'
import { evaluate } from '../eval'
import { Context } from '../walk'
import { createDataContext } from './data'

const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/
const forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/
const stripParensRE = /^\(|\)$/g

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

  el.removeAttribute('v-for')

  const parent = el.parentElement!
  const anchor = new Text('')
  parent.insertBefore(anchor, el)
  parent.removeChild(el)

  const sourceExp = inMatch[2].trim()
  let valueExp = inMatch[1].trim().replace(stripParensRE, '').trim()
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

  const iteratorMatch = valueExp.match(forIteratorRE)
  if (iteratorMatch) {
    valueExp = valueExp.replace(forIteratorRE, '').trim()
    indexExp = iteratorMatch[1].trim()
    if (iteratorMatch[2]) {
      objIndexExp = iteratorMatch[2].trim()
    }
  }

  let mounted = false
  let blocks: Block[]
  let scopes: ChildScope[]
  let keyToIndexMap: Map<any, number>

  function createChildScopes(source: unknown): [ChildScope[], KeyToIndexMap] {
    const map: KeyToIndexMap = new Map()
    const scopes: ChildScope[] = []

    function createScope(
      value: any,
      index: number,
      objKey?: string
    ): ChildScope {
      // TODO destructure
      const data = { [valueExp]: value }
      if (objKey) {
        indexExp && (data[indexExp] = objKey)
        objIndexExp && (data[objIndexExp] = index)
      } else {
        indexExp && (data[indexExp] = index)
      }
      const childCtx = createDataContext(ctx, data)
      const key = keyExp ? evaluate(childCtx.scope, keyExp) : index
      map.set(key, index)
      return {
        ctx: childCtx,
        key
      }
    }

    if (isArray(source)) {
      for (let i = 0; i < source.length; i++) {
        scopes.push(createScope(source[i], i))
      }
    } else if (typeof source === 'number') {
      for (let i = 0; i < source; i++) {
        scopes.push(createScope(i + 1, i))
      }
    } else if (isObject(source)) {
      let i = 0
      for (const key in source) {
        scopes.push(createScope(source[key], i++, key))
      }
    }

    return [scopes, map]
  }

  function mountBlock({ ctx, key }: ChildScope, ref: Node) {
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
      blocks = []
      for (const scope of scopes) {
        blocks.push(mountBlock(scope, anchor))
      }
      mounted = true
    } else {
      const nextBlocks: Block[] = new Array(scopes.length)
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
