import { describe, it, expect, beforeEach, vi } from 'vitest'
import { reactive } from '@vue/reactivity'
import {
  createContext,
  createScopedContext,
  bindContextMethods,
  Context
} from '../src/context'
import { queueJob, nextTick } from '../src/scheduler'

describe('context', () => {
  describe('createContext', () => {
    it('should create context with default values', () => {
      const ctx = createContext()

      expect(ctx.scope).toBeDefined()
      expect(ctx.dirs).toEqual({})
      expect(ctx.blocks).toEqual([])
      expect(ctx.effects).toEqual([])
      expect(ctx.cleanups).toEqual([])
      expect(ctx.delimiters).toEqual(['{{', '}}'])
      expect(ctx.delimitersRE).toBeInstanceOf(RegExp)
    })

    it('should create child context inheriting from parent', () => {
      const parent = createContext()
      parent.dirs.test = vi.fn()
      parent.scope.testValue = 'parent'

      const child = createContext(parent)

      expect(child.dirs).toBe(parent.dirs)
      expect(child.scope).toBe(parent.scope)
      expect(child.blocks).not.toBe(parent.blocks)
    })

    it('should create effect with scheduler', async () => {
      const ctx = createContext()
      const state = reactive({ count: 0 })
      const fn = vi.fn(() => state.count)
      const effect = ctx.effect(fn)

      expect(ctx.effects).toContain(effect)
      expect(typeof effect).toBe('function')
      expect(fn).toHaveBeenCalledTimes(1)

      state.count++
      expect(fn).toHaveBeenCalledTimes(1)
      await nextTick()
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('createScopedContext', () => {
    it('should create scoped context with merged scope', () => {
      const parent = createContext()
      parent.scope.parentValue = 'parent'
      parent.scope.$refs = Object.create(null)

      const scoped = createScopedContext(parent, { childValue: 'child' })

      expect(scoped.scope.parentValue).toBe('parent')
      expect(scoped.scope.childValue).toBe('child')
      expect(scoped.scope).not.toBe(parent.scope)
    })

    it('should set owned properties on target without polluting parent scope', () => {
      const parent = createContext()
      parent.scope.$refs = Object.create(null)
      const scoped = createScopedContext(parent, { childValue: 'initial' })

      scoped.scope.childValue = 'updated'
      expect(scoped.scope.childValue).toBe('updated')
      expect(parent.scope.childValue).toBeUndefined()
    })

    it('should set property on prototype inheriting receiver without setting on parent scope', () => {
      const parent = createContext()
      parent.scope.$refs = Object.create(null)
      const scoped = createScopedContext(parent)

      const child = Object.create(scoped.scope)
      child.childProp = 'childValue'

      expect(Object.prototype.hasOwnProperty.call(child, 'childProp')).toBe(true)
      expect(parent.scope.childProp).toBeUndefined()
    })

    it('should bind methods in scoped context to scoped proxy', () => {
      const parent = createContext()
      parent.scope.$refs = Object.create(null)
      const scoped = createScopedContext(parent, {
        value: 'scoped',
        getMethod() {
          return this.value
        }
      })

      const { getMethod } = scoped.scope
      expect(getMethod()).toBe('scoped')
    })

    it('should handle refs inheritance', () => {
      const parent = createContext()
      parent.scope.$refs = Object.create(null)
      parent.scope.$refs.parentRef = 'test'

      const scoped = createScopedContext(parent)

      expect(scoped.scope.$refs).not.toBe(parent.scope.$refs)
      expect(scoped.scope.$refs.parentRef).toBe('test')
    })

    it('should fallback to parent scope for non-existent properties', () => {
      const parent = createContext()
      parent.scope.parentValue = 'parent'
      parent.scope.$refs = Object.create(null)

      const scoped = createScopedContext(parent)

      scoped.scope.newValue = 'child'
      expect(parent.scope.newValue).toBe('child')
    })
  })

  describe('bindContextMethods', () => {
    it('should bind all functions in scope to scope itself', () => {
      const scope = reactive({
        value: 'test',
        method: function() {
          return this.value
        }
      })

      bindContextMethods(scope)

      const { method } = scope
      expect(method()).toBe('test')
    })

    it('should not bind non-function properties', () => {
      const scope = reactive({
        value: 'test',
        notAFunction: 42
      })

      bindContextMethods(scope)

      expect(scope.notAFunction).toBe(42)
    })

    it('should handle empty scope', () => {
      const scope = reactive({})

      expect(() => bindContextMethods(scope)).not.toThrow()
    })
  })
})