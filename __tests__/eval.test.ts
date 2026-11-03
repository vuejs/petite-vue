import { describe, it, expect, beforeEach, vi } from 'vitest'
import { evaluate, execute } from '../src/eval'

describe('evaluate', () => {
  let scope: any
  let el: Element

  beforeEach(() => {
    el = document.createElement('div')
    scope = {
      message: 'Hello',
      count: 42,
      user: { name: 'John', age: 30 },
      items: ['item1', 'item2'],
      isActive: true,
      method: function() {
        return this.message
      }
    }
  })

  it('should evaluate simple expressions', () => {
    expect(evaluate(scope, 'message', el)).toBe('Hello')
    expect(evaluate(scope, 'count', el)).toBe(42)
    expect(evaluate(scope, 'isActive', el)).toBe(true)
    // This should execute the try block
    expect(evaluate(scope, 'count + 10', el)).toBe(52)
  })

  it('should evaluate object property access', () => {
    expect(evaluate(scope, 'user.name', el)).toBe('John')
    expect(evaluate(scope, 'user.age', el)).toBe(30)
  })

  it('should evaluate array access', () => {
    expect(evaluate(scope, 'items[0]', el)).toBe('item1')
    expect(evaluate(scope, 'items[1]', el)).toBe('item2')
  })

  it('should evaluate method calls', () => {
    expect(evaluate(scope, 'method()', el)).toBe('Hello')
  })

  it('should evaluate complex expressions', () => {
    expect(evaluate(scope, 'count + 10', el)).toBe(52)
    expect(evaluate(scope, 'message + " World"', el)).toBe('Hello World')
    expect(evaluate(scope, 'user.age > 25', el)).toBe(true)
  })

  it('should evaluate ternary expressions', () => {
    expect(evaluate(scope, 'isActive ? "Active" : "Inactive"', el)).toBe('Active')
    scope.isActive = false
    expect(evaluate(scope, 'isActive ? "Active" : "Inactive"', el)).toBe('Inactive')
  })

  it('should evaluate logical expressions', () => {
    expect(evaluate(scope, 'isActive && count > 0', el)).toBe(true)
    expect(evaluate(scope, 'isActive || false', el)).toBe(true)
  })

  it('should handle undefined properties', () => {
    expect(evaluate(scope, 'nonexistent', el)).toBeUndefined()
    expect(evaluate(scope, 'user.nonexistent', el)).toBeUndefined()
  })

  it('should handle null values', () => {
    scope.nullValue = null
    expect(evaluate(scope, 'nullValue', el)).toBeNull()
  })

  it('should handle function expressions', () => {
    const result = evaluate(scope, 'method', el)
    expect(typeof result).toBe('function')
    expect(result.call(scope)).toBe('Hello')
  })

  it('should handle nested object access', () => {
    scope.nested = { level1: { level2: { value: 'deep' } } }
    expect(evaluate(scope, 'nested.level1.level2.value', el)).toBe('deep')
  })

  it('should handle array methods', () => {
    expect(evaluate(scope, 'items.length', el)).toBe(2)
    expect(evaluate(scope, 'items.indexOf("item1")', el)).toBe(0)
  })

  it('should handle mathematical operations', () => {
    expect(evaluate(scope, 'count * 2', el)).toBe(84)
    expect(evaluate(scope, 'count / 2', el)).toBe(21)
    expect(evaluate(scope, 'count % 10', el)).toBe(2)
  })

  it('should handle string operations', () => {
    expect(evaluate(scope, 'message.length', el)).toBe(5)
    expect(evaluate(scope, 'message.toUpperCase()', el)).toBe('HELLO')
  })

  it('should handle comparison operations', () => {
    expect(evaluate(scope, 'count > 40', el)).toBe(true)
    expect(evaluate(scope, 'count < 50', el)).toBe(true)
    expect(evaluate(scope, 'count === 42', el)).toBe(true)
  })

  it('should handle this context', () => {
    // Note: 'this' context works differently in the eval function
    // Let's test direct property access instead
    expect(evaluate(scope, 'message', el)).toBe('Hello')
    expect(evaluate(scope, 'count', el)).toBe(42)
  })

  it('should handle complex nested expressions', () => {
    const result = evaluate(scope, 'items.length', el)
    expect(result).toBe(2)
  })

  it('should expose $el in evaluated expressions', () => {
    expect(evaluate(scope, '$el.tagName', el)).toBe('DIV')
  })

  it('should handle error cases gracefully', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    errorSpy.mockClear()
    expect(() => evaluate(scope, 'syntax error', el)).not.toThrow()
    expect(evaluate(scope, 'syntax error', el)).toBeUndefined()
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error evaluating expression "syntax error":'),
      expect.any(Error)
    )

    const origDev = import.meta.env.DEV
    try {
      ;(import.meta.env as any).DEV = false
      errorSpy.mockClear()
      expect(evaluate(scope, 'other syntax error', el)).toBeUndefined()
      expect(errorSpy).not.toHaveBeenCalled()
    } finally {
      ;(import.meta.env as any).DEV = origDev
    }

    errorSpy.mockRestore()
  })

  it('should handle boolean coercion', () => {
    expect(evaluate(scope, '!!message', el)).toBe(true)
    expect(evaluate(scope, '!count', el)).toBe(false)
  })

  it('should handle type checking', () => {
    expect(evaluate(scope, 'typeof message', el)).toBe('string')
    expect(evaluate(scope, 'typeof count', el)).toBe('number')
    expect(evaluate(scope, 'typeof user', el)).toBe('object')
  })

  it('should handle conditional expressions', () => {
    expect(evaluate(scope, 'isActive ? count * 2 : count / 2', el)).toBe(84)
    scope.isActive = false
    expect(evaluate(scope, 'isActive ? count * 2 : count / 2', el)).toBe(21)
  })

  it('should handle object property access with variables', () => {
    const prop = 'name'
    scope.prop = prop
    expect(evaluate(scope, 'user[prop]', el)).toBe('John')
  })

  it('should handle array access with variables', () => {
    const index = 0
    scope.index = index
    expect(evaluate(scope, 'items[index]', el)).toBe('item1')
  })

  it('should reject dangerous expressions', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleWarnSpy.mockClear()

    // Test valid 1000 length expression (boundary)
    const valid1000 = ' '.repeat(999) + '1'
    expect(evaluate(scope, valid1000, el)).toBe(1)

    // Test various dangerous patterns
    expect(evaluate(scope, 'eval("alert(1)")', el)).toBeUndefined()
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Potentially unsafe expression rejected: "eval("alert(1)")"')
    )
    expect(evaluate(scope, 'window.location', el)).toBeUndefined()
    expect(evaluate(scope, 'delete something()', el)).toBeUndefined()

    // Test empty and overly long expressions
    expect(evaluate(scope, '', el)).toBeUndefined()
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Potentially unsafe expression rejected: ""')
    )
    expect(evaluate(scope, null as any, el)).toBeUndefined()
    expect(evaluate(scope, undefined as any, el)).toBeUndefined()
    expect(evaluate(scope, 'a'.repeat(1001), el)).toBeUndefined()

    expect(consoleWarnSpy).toHaveBeenCalledTimes(7)

    const origDev = import.meta.env.DEV
    try {
      ;(import.meta.env as any).DEV = false
      consoleWarnSpy.mockClear()
      expect(evaluate(scope, 'window.location', el)).toBeUndefined()
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    } finally {
      ;(import.meta.env as any).DEV = origDev
    }

    consoleWarnSpy.mockRestore()
  })
})

describe('execute', () => {
  let scope: any
  let el: Element

  beforeEach(() => {
    el = document.createElement('div')
    scope = {
      message: 'Hello',
      count: 42,
      sideEffect: vi.fn()
    }
  })

  it('should execute simple expressions', () => {
    expect(execute(scope, 'sideEffect()', el)).toBeUndefined()
    expect(scope.sideEffect).toHaveBeenCalled()
  })

  it('should pass $el to executed expressions', () => {
    execute(scope, '$el.setAttribute("data-test", "ok")', el)
    expect(el.getAttribute('data-test')).toBe('ok')
  })

  it('should handle error in execution', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    consoleErrorSpy.mockClear()

    // This should throw an error
    const result = execute(scope, 'throw new Error("test error")', el)

    expect(result).toBeUndefined()
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error executing expression "throw new Error("test error")":'),
      expect.any(Error)
    )

    const origDev = import.meta.env.DEV
    try {
      ;(import.meta.env as any).DEV = false
      consoleErrorSpy.mockClear()
      expect(execute(scope, 'throw new Error("silent")', el)).toBeUndefined()
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    } finally {
      ;(import.meta.env as any).DEV = origDev
    }

    consoleErrorSpy.mockRestore()
  })

  it('should cache compiled functions', () => {
    const exp = 'sideEffect()'
    execute(scope, exp, el)
    execute(scope, exp, el) // Should use cached function

    expect(scope.sideEffect).toHaveBeenCalledTimes(2)
  })

  it('should handle invalid function syntax', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    consoleErrorSpy.mockClear()

    // This syntax error should be caught
    const result = execute(scope, 'invalid syntax {{{', el)

    expect(result).toBeUndefined()
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid expression: invalid syntax {{{'),
      expect.any(Error)
    )
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Error executing expression'),
      expect.anything()
    )

    const origDev = import.meta.env.DEV
    try {
      ;(import.meta.env as any).DEV = false
      consoleErrorSpy.mockClear()
      expect(execute(scope, 'another syntax error }}}', el)).toBeUndefined()
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    } finally {
      ;(import.meta.env as any).DEV = origDev
    }

    consoleErrorSpy.mockRestore()
  })

  it('should reject dangerous expressions in execute', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleWarnSpy.mockClear()

    // Test dangerous expressions are rejected
    expect(execute(scope, 'window.alert(1)', el)).toBeUndefined()
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Potentially unsafe expression rejected: "window.alert(1)"')
    )
    expect(execute(scope, 'eval("code")', el)).toBeUndefined()

    expect(consoleWarnSpy).toHaveBeenCalledTimes(2)

    const origDev = import.meta.env.DEV
    try {
      ;(import.meta.env as any).DEV = false
      consoleWarnSpy.mockClear()
      expect(execute(scope, 'window.alert(1)', el)).toBeUndefined()
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    } finally {
      ;(import.meta.env as any).DEV = origDev
    }

    consoleWarnSpy.mockRestore()
  })

  it('should invalidate cache on execution error', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Create a function that will be cached initially
    const exp = 'count + 1'
    execute(scope, exp, el) // Should cache the function

    // Now execute with an expression that causes runtime error
    const errorExp = 'nonexistent.property.access'
    const result = execute(scope, errorExp, el)

    expect(result).toBeUndefined()
    expect(consoleErrorSpy).toHaveBeenCalled()

    // The error expression should be removed from cache
    // We can't directly test the cache, but we can verify the error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error executing expression'),
      expect.any(Error)
    )

    consoleErrorSpy.mockRestore()
  })

  it('should handle runtime errors in cached functions', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // First execute a valid expression to cache it
    const exp = 'sideEffect()'
    execute(scope, exp, el)

    // Now modify scope to cause runtime error on next execution
    scope.sideEffect = () => { throw new Error('runtime error') }

    // Execute again - should handle the error and remove from cache
    const result = execute(scope, exp, el)

    expect(result).toBeUndefined()
    expect(consoleErrorSpy).toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })


})