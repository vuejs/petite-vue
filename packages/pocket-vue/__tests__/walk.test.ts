import { describe, it, expect, beforeEach, vi } from 'vitest'
import { walk } from '../src/walk'
import { createContext } from '../src/context'
import { _if } from '../src/directives/if'
import { nextTick } from '../src/scheduler'

describe('walk', () => {
  let container: HTMLElement
  let ctx: any

  beforeEach(() => {
    container = document.createElement('div')
    ctx = createContext()
    ctx.scope.$refs = Object.create(null)
    ctx.scope.$s = (value: any) => value == null ? '' : String(value)
  })

  it('should walk through DOM elements', () => {
    container.innerHTML = '<div v-scope><span>{{ message }}</span><button @click="handleClick">Click</button></div>'

    ctx.scope.message = 'Hello'
    ctx.scope.handleClick = vi.fn()
    walk(container, ctx)

    expect(container.innerHTML).toContain('Hello')
  })

  it('should skip elements with v-pre', () => {
    container.innerHTML = '<div v-pre><span>{{ message }}</span></div><div v-scope><span>{{ message }}</span></div>'

    ctx.scope.message = 'Hello'
    walk(container, ctx)

    const divs = container.querySelectorAll('div')
    // First div should not be processed (still has {{ message }})
    expect(divs[0].innerHTML).toContain('{{ message }}')
    // Second div should be processed
    expect(divs[1].innerHTML).toContain('Hello')
  })



  it('should handle v-scope directive', () => {
    container.innerHTML = '<div v-scope="{ localCount: 0 }"><span>{{ localCount }}</span></div>'

    walk(container, ctx)

    expect(container.innerHTML).toContain('0')
  })

  it('should handle v-if directive', () => {
    // Test with show = true
    const container1 = document.createElement('div')
    container1.innerHTML = '<div v-if="show">Visible</div>'
    ctx.scope.show = true
    walk(container1, ctx)
    expect(container1.innerHTML).toContain('Visible')

    // Test with show = false
    const container2 = document.createElement('div')
    container2.innerHTML = '<div v-if="show">Visible</div>'
    ctx.scope.show = false
    walk(container2, ctx)
    expect(container2.innerHTML).not.toContain('Visible')
  })

  it('should handle v-if with v-else', () => {
    const container = document.createElement('div')
    container.innerHTML = '<div v-if="show">True</div><div v-else>False</div>'
    ctx.scope.show = false
    walk(container, ctx)
    expect(container.innerHTML).toContain('False')
    expect(container.innerHTML).not.toContain('True')
  })

  it('should handle v-if with v-else-if', () => {
    const container = document.createElement('div')
    container.innerHTML = '<div v-if="a">A</div><div v-else-if="b">B</div><div v-else>C</div>'
    ctx.scope.a = false
    ctx.scope.b = true
    walk(container, ctx)
    expect(container.innerHTML).toContain('B')
    expect(container.innerHTML).not.toContain('A')
    expect(container.innerHTML).not.toContain('C')
  })

  it('should warn for empty v-if in DEV', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { })
    const originalDEV = (globalThis as any).import?.meta?.env?.DEV
      ; (globalThis as any).import = { meta: { env: { DEV: true } } }

    const container = document.createElement('div')
    container.innerHTML = '<div v-if=" ">Empty</div>'
    walk(container, ctx)

    expect(warnSpy).toHaveBeenCalledWith('v-if expression cannot be empty.')

    warnSpy.mockRestore()
    if (originalDEV !== undefined) {
      ; (globalThis as any).import.meta.env.DEV = originalDEV
    } else {
      delete (globalThis as any).import
    }
  })

  it('should not warn when v-if expression is non-empty', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const originalDEV = (globalThis as any).import?.meta?.env?.DEV
    ;(globalThis as any).import = { meta: { env: { DEV: true } } }

    const container = document.createElement('div')
    container.innerHTML = '<div v-if="ok">Valid</div>'
    ctx.scope.ok = true
    walk(container, ctx)

    expect(warnSpy).not.toHaveBeenCalled()

    warnSpy.mockRestore()
    if (originalDEV !== undefined) {
      ;(globalThis as any).import.meta.env.DEV = originalDEV
    } else {
      delete (globalThis as any).import
    }
  })

  it('should handle v-if on element whose parent is a DocumentFragment', () => {
    const fragment = document.createDocumentFragment()
    const el = document.createElement('div')
    el.setAttribute('v-if', 'show')
    el.textContent = 'Fragment Child'
    fragment.appendChild(el)

    ctx.scope.show = true
    const next = _if(el, 'show', ctx)

    expect(next).toBeNull()
    expect(fragment.textContent).toContain('Fragment Child')
  })

  it('should create v-if anchor comment when hidden and remove anchor when active', async () => {
    const container = document.createElement('div')
    container.innerHTML = '<div v-if="show">Content</div>'
    ctx.scope.show = false
    walk(container, ctx)

    const comment = Array.from(container.childNodes).find((n) => n.nodeType === Node.COMMENT_NODE) as Comment
    expect(comment).toBeDefined()
    expect(comment.data).toBe('v-if')

    ctx.scope.show = true
    await nextTick()

    const commentWhenVisible = Array.from(container.childNodes).find((n) => n.nodeType === Node.COMMENT_NODE)
    expect(commentWhenVisible).toBeUndefined()
    expect(container.textContent).toContain('Content')
  })

  it('should preserve DOM node identity when active branch stays unchanged', async () => {
    const container = document.createElement('div')
    container.innerHTML = '<div v-if="count > 0"><span id="inner">Positive</span></div>'
    ctx.scope.count = 1
    walk(container, ctx)

    const innerSpan = container.querySelector('#inner')
    expect(innerSpan).not.toBeNull()

    ctx.scope.count = 2
    await nextTick()

    expect(container.querySelector('#inner')).toBe(innerSpan)
  })

  it('should clean up previous branch when switching between v-if and v-else', async () => {
    const container = document.createElement('div')
    container.innerHTML = '<div v-if="show" id="branch-if">True Branch</div><div v-else id="branch-else">False Branch</div>'
    ctx.scope.show = true
    walk(container, ctx)

    expect(container.querySelector('#branch-if')).not.toBeNull()
    expect(container.querySelector('#branch-else')).toBeNull()

    ctx.scope.show = false
    await nextTick()

    expect(container.querySelector('#branch-if')).toBeNull()
    expect(container.querySelector('#branch-else')).not.toBeNull()
  })

  it('should correctly activate branch 1 after being in no-match state', async () => {
    const container = document.createElement('div')
    container.innerHTML = '<div v-if="a" id="branch-a">A</div><div v-else-if="b" id="branch-b">B</div>'
    ctx.scope.a = false
    ctx.scope.b = false
    walk(container, ctx)

    expect(container.querySelector('#branch-a')).toBeNull()
    expect(container.querySelector('#branch-b')).toBeNull()

    ctx.scope.b = true
    await nextTick()

    expect(container.querySelector('#branch-b')).not.toBeNull()
    expect(container.textContent).toContain('B')
  })

  it('should handle v-if on element with no parent', () => {
    const el = document.createElement('div')
    el.setAttribute('v-if', 'true')

    // _if should return early if no parent
    const result = _if(el, 'true', ctx)
    expect(result).toBeUndefined()
  })

  it('should handle v-for directive', () => {
    container.innerHTML = '<ul><li v-for="item in items">{{ item }}</li></ul>'

    ctx.scope.items = ['Item 1', 'Item 2']
    walk(container, ctx)

    const items = container.querySelectorAll('li')
    expect(items.length).toBe(2)
    expect(items[0]?.textContent).toBe('Item 1')
    expect(items[1]?.textContent).toBe('Item 2')
  })

  it('should handle v-for with number', () => {
    container.innerHTML = '<ul><li v-for="i in count">{{ i }}</li></ul>'

    ctx.scope.count = 3
    walk(container, ctx)

    const items = container.querySelectorAll('li')
    expect(items.length).toBe(3)
    expect(items[0]?.textContent).toBe('1')
    expect(items[1]?.textContent).toBe('2')
    expect(items[2]?.textContent).toBe('3')
  })

  it('should handle v-for with object', () => {
    container.innerHTML = '<ul><li v-for="value, key in obj">{{ key }}: {{ value }}</li></ul>'

    ctx.scope.obj = { a: 1, b: 2 }
    walk(container, ctx)

    const items = container.querySelectorAll('li')
    expect(items.length).toBe(2)
    // Order may vary, but check content
    const texts = Array.from(items).map(li => li.textContent)
    expect(texts).toContain('a: 1')
    expect(texts).toContain('b: 2')
  })

  it('should handle v-for with index', () => {
    container.innerHTML = '<ul><li v-for="item, index in items">{{ index }}: {{ item }}</li></ul>'

    ctx.scope.items = ['A', 'B']
    walk(container, ctx)

    const items = container.querySelectorAll('li')
    expect(items[0]?.textContent).toBe('0: A')
    expect(items[1]?.textContent).toBe('1: B')
  })

  it('should handle v-for with key', () => {
    container.innerHTML = '<ul><li v-for="item in items" :key="item.id">{{ item.name }}</li></ul>'

    ctx.scope.items = [{ id: 1, name: 'First' }, { id: 2, name: 'Second' }]
    walk(container, ctx)

    const items = container.querySelectorAll('li')
    expect(items[0]?.textContent).toBe('First')
    expect(items[1]?.textContent).toBe('Second')
  })

  it('should handle v-for with destructure', () => {
    container.innerHTML = '<ul><li v-for="{name, age} in people">{{ name }} ({{ age }})</li></ul>'

    ctx.scope.people = [{ name: 'John', age: 30 }, { name: 'Jane', age: 25 }]
    walk(container, ctx)

    const items = container.querySelectorAll('li')
    expect(items[0]?.textContent).toBe('John (30)')
    expect(items[1]?.textContent).toBe('Jane (25)')
  })

  it('should warn for invalid v-for in DEV', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { })
    const originalDEV = (globalThis as any).import?.meta?.env?.DEV
      ; (globalThis as any).import = { meta: { env: { DEV: true } } }

    container.innerHTML = '<ul><li v-for="invalid">item</li></ul>'
    walk(container, ctx)

    expect(warnSpy).toHaveBeenCalledWith('invalid v-for expression: invalid')

    warnSpy.mockRestore()
    if (originalDEV !== undefined) {
      ; (globalThis as any).import.meta.env.DEV = originalDEV
    } else {
      delete (globalThis as any).import
    }
  })

  it('should handle v-for updates and moves', async () => {
    container.innerHTML = '<ul><li v-for="item in items" :key="item">{{ item }}</li></ul>'

    ctx.scope.items = ['A', 'B', 'C']
    walk(container, ctx)

    let items = container.querySelectorAll('li')
    expect(items.length).toBe(3)
    expect(Array.from(items).map(li => li.textContent)).toEqual(['A', 'B', 'C'])

    // Update to trigger move and reordering
    ctx.scope.items = ['C', 'A', 'B']
    await nextTick()

    items = container.querySelectorAll('li')
    expect(items.length).toBe(3)
    expect(Array.from(items).map(li => li.textContent)).toEqual(['C', 'A', 'B'])
  })

  it('should handle attribute interpolation', () => {
    container.innerHTML = '<div :id="dynamicId" :class="dynamicClass">Content</div>'

    ctx.scope.dynamicId = 'test-id'
    ctx.scope.dynamicClass = 'test-class'
    walk(container, ctx)

    const div = container.querySelector('div')
    expect(div?.getAttribute('id')).toBe('test-id')
    expect(div?.getAttribute('class')).toBe('test-class')
  })

  it('should handle text interpolation', () => {
    container.innerHTML = '<div>{{ message }}</div>'

    ctx.scope.message = 'Hello World'
    walk(container, ctx)

    const div = container.querySelector('div')
    expect(div?.textContent).toBe('Hello World')
  })

  it('should handle event handlers', () => {
    container.innerHTML = '<button @click="handleClick">Click</button>'

    const handleClick = vi.fn()
    ctx.scope.handleClick = handleClick
    walk(container, ctx)

    const button = container.querySelector('button')
    button?.click()

    expect(handleClick).toHaveBeenCalled()
  })

  it('should handle nested directives', () => {
    container.innerHTML = '<div v-scope="{ localData: { count: 0 } }"><div v-if="show"><span>{{ localData.count }}</span></div></div>'

    ctx.scope.show = true
    walk(container, ctx)

    expect(container.innerHTML).toContain('0')
  })

  it('should handle multiple directives on same element', () => {
    container.innerHTML = '<div v-show="isVisible" :class="dynamicClass">Content</div>'

    ctx.scope.isVisible = true
    ctx.scope.dynamicClass = 'active'
    walk(container, ctx)

    const div = container.querySelector('div')
    expect(div?.style.display).not.toBe('none')
    expect(div?.getAttribute('class')).toBe('active')
  })

  it('should handle custom delimiters', () => {
    container.innerHTML = '<div>${ message }</div>'

    ctx.scope.message = 'Hello'
    ctx.delimiters = ['${', '}']
    ctx.delimitersRE = /\$\{([^]+?)\}/g

    walk(container, ctx)

    const div = container.querySelector('div')
    expect(div?.textContent).toBe('Hello')
  })



  it('should handle unknown custom directive in DEV', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })
    const originalDEV = (globalThis as any).import?.meta?.env?.DEV
      ; (globalThis as any).import = { meta: { env: { DEV: true } } }

    container.innerHTML = '<div v-unknown="value"></div>'
    walk(container, ctx)

    expect(errorSpy).toHaveBeenCalledWith('unknown custom directive v-unknown.')

    errorSpy.mockRestore()
    if (originalDEV !== undefined) {
      ; (globalThis as any).import.meta.env.DEV = originalDEV
    } else {
      delete (globalThis as any).import
    }
  })

  it('should handle v-scope with $template selector', () => {
    // Create a template element
    const template = document.createElement('template')
    template.id = 'my-template'
    template.innerHTML = '<span>Template content</span>'
    document.body.appendChild(template)

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    container.innerHTML = "<div v-scope=\"{ $template: '#my-template' }\"></div>"
    walk(container, ctx)

    const div = container.querySelector('div')
    expect(div?.innerHTML).toContain('Template content')
    expect(errorSpy).not.toHaveBeenCalled()
    errorSpy.mockRestore()

    document.body.removeChild(template)
  })

  it('should handle v-scope with $template string', () => {
    container.innerHTML = "<div v-scope=\"{ $template: '<template><span>String template</span></template>' }\"></div>"
    walk(container, ctx)

    const div = container.querySelector('div')
    expect(div?.innerHTML).toBe('<span>String template</span>')
  })

  it('should handle v-once directive', async () => {
    container.innerHTML = '<div v-once :title="message"><p>static</p><span>{{ message }}</span></div><p id="outside">{{ message }}</p>'

    ctx.scope.message = 'Initial value'
    walk(container, ctx)

    // Wait for the initial effect to run
    await nextTick()

    // v-once should interpolate once with current data
    const div = container.querySelector('div')
    const span = container.querySelector('span')
    const outside = container.querySelector('#outside')
    expect(div?.getAttribute('title')).toBe('Initial value')
    expect(span?.textContent).toBe('Initial value')
    expect(outside?.textContent).toBe('Initial value')

    // The v-once attribute should be removed after processing
    expect(div?.hasAttribute('v-once')).toBe(false)

    // Even after changing the scope data, v-once should not update, but sibling outside should update
    ctx.scope.message = 'Updated value'
    await nextTick()
    expect(div?.getAttribute('title')).toBe('Initial value')
    expect(span?.textContent).toBe('Initial value')
    expect(outside?.textContent).toBe('Updated value')
  })

  it('should register ref in both parent and scoped context when used with v-scope', () => {
    container.innerHTML = '<div v-scope="{ data: 42 }" ref="scopedRef"><span id="inner">{{ $refs.scopedRef.tagName }}</span></div>'

    ctx.scope.$refs = {}
    walk(container, ctx)

    // The ref should be registered in parent scope
    const div = container.querySelector('div')
    expect(ctx.scope.$refs.scopedRef).toBe(div)
    
    // The ref should also be available in the scoped context (verified via interpolation)
    const span = container.querySelector('#inner')
    expect(span?.textContent).toBe('DIV')
  })

  it('should handle v-scope with empty expression', () => {
    container.innerHTML = '<div v-scope=""><span>{{ $root.tagName }}</span></div>'

    walk(container, ctx)

    const span = container.querySelector('span')
    expect(span?.textContent).toBe('DIV')
  })

  it('should handle directive cleanup functions', () => {
    // Create a mock directive that returns a cleanup function
    const mockDirective = vi.fn(() => {
      return () => { } // cleanup function
    })

    ctx.dirs = { 'test-dir': mockDirective }

    container.innerHTML = '<div v-test-dir="value"></div>'

    walk(container, ctx)

    expect(mockDirective).toHaveBeenCalled()
  })

  it('should handle :ref shorthand', () => {
    container.innerHTML = '<div :ref="myRef"></div>'

    ctx.scope.$refs = {}
    walk(container, ctx)

    // :ref should be handled as ref directive and correctly register in the scope
    const div = container.querySelector('div')
    expect(div).toBeDefined()
    expect(ctx.scope.$refs.myRef).toBe(div)
  })

  it('should process DocumentFragment nodes', () => {
    const fragment = document.createDocumentFragment()
    const div = document.createElement('div')
    div.textContent = '{{ message }}'
    fragment.appendChild(div)

    ctx.scope.message = 'Fragment content'
    walk(fragment, ctx)

    expect(div.textContent).toBe('Fragment content')
  })

  it('should warn for invalid template selector in DEV', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

    container.innerHTML = "<div v-scope=\"{ $template: '#nonexistent' }\"></div>"
    walk(container, ctx)

    expect(errorSpy).toHaveBeenCalledWith(
      'template selector #nonexistent has no matching <template> element.'
    )

    errorSpy.mockRestore()
  })

  it('should not warn for invalid template selector when DEV is false', () => {
    const originalDev = import.meta.env.DEV
    ;(import.meta.env as any).DEV = false
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      container.innerHTML = "<div v-scope=\"{ $template: '#nonexistent' }\"></div>"
      walk(container, ctx)
      expect(errorSpy).not.toHaveBeenCalled()
    } finally {
      ;(import.meta.env as any).DEV = originalDev
      errorSpy.mockRestore()
    }
  })

  it('should remove v-cloak attribute and not log error', () => {
    container.innerHTML = '<div v-cloak>Cloaked</div>'
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    walk(container, ctx)

    const div = container.querySelector('div')!
    expect(div.hasAttribute('v-cloak')).toBe(false)
    expect(errorSpy).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('should remove directive attribute from DOM and preserve standard directive behavior', () => {
    container.innerHTML = '<div :id="myId"></div>'
    ctx.scope.myId = 'custom-id'
    walk(container, ctx)

    const div = container.querySelector('div')!
    expect(div.id).toBe('custom-id')
    expect(div.hasAttribute(':id')).toBe(false)
    expect(ctx.scope.$refs.myId).toBeUndefined()
  })

  it('should execute v-model before deferred v-on and @ listeners', () => {
    container.innerHTML = `
      <input id="input1" :value="text" v-on:input="recordVOn" v-model="text">
      <input id="input2" :value="text2" @input="recordAt" v-model="text2">
    `
    let observedVOn = ''
    let observedAt = ''
    ctx.scope.text = 'initial'
    ctx.scope.text2 = 'initial'
    ctx.scope.recordVOn = () => {
      observedVOn = ctx.scope.text
    }
    ctx.scope.recordAt = () => {
      observedAt = ctx.scope.text2
    }
    walk(container, ctx)

    const input1 = container.querySelector('#input1') as HTMLInputElement
    input1.value = 'updated1'
    input1.dispatchEvent(new Event('input'))
    expect(observedVOn).toBe('updated1')

    const input2 = container.querySelector('#input2') as HTMLInputElement
    input2.value = 'updated2'
    input2.dispatchEvent(new Event('input'))
    expect(observedAt).toBe('updated2')
  })

  it('should not pass arg property to directive when arg is undefined', () => {
    let hasArg = true
    ctx.dirs.custom = (opts: any) => {
      hasArg = 'arg' in opts
    }
    container.innerHTML = '<div v-custom="val"></div>'
    walk(container, ctx)

    expect(hasArg).toBe(false)
  })

  it('should not push undefined to cleanups when directive has no cleanup', () => {
    container.innerHTML = '<div><span>{{ message }}</span></div>'
    ctx.scope.message = 'hi'
    walk(container, ctx)

    expect(ctx.cleanups.length).toBe(0)
  })

  it('should not attach effect to plain text nodes without delimiters', () => {
    container.innerHTML = '<div>Plain text without expressions</div>'
    walk(container, ctx)

    expect(ctx.effects.length).toBe(0)
  })

  it('should only register single cleanup for ref when context has no parent', () => {
    container.innerHTML = '<div ref="singleRef"></div>'
    walk(container, ctx)
    expect(ctx.cleanups.length).toBe(1)
  })

  it('should not treat non-directive attributes as directives', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    container.innerHTML = '<div id="test-id" class="test-class" data-v-on="foo"></div>'
    walk(container, ctx)
    expect(errorSpy).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('should defer v-model to process after :value binding when v-model appears first', () => {
    container.innerHTML = '<input type="radio" v-model="picked" :value="opt">'
    const opt = { id: 1 }
    ctx.scope.opt = opt
    ctx.scope.picked = opt
    walk(container, ctx)

    const input = container.querySelector('input') as HTMLInputElement
    expect(input.checked).toBe(true)
  })

  it('should construct precise expression without leading or trailing empty strings', () => {
    ctx.scope.$s = (val: any) => {
      const fn = () => String(val)
      fn[Symbol.toPrimitive] = (hint: string) => {
        if (hint === 'default') {
          throw new Error('binary plus coercion should not happen')
        }
        return String(val)
      }
      return fn
    }
    ctx.scope.message = 'exact'
    container.innerHTML = '<div>{{ message }}</div>'

    expect(() => walk(container, ctx)).not.toThrow()
    const div = container.querySelector('div')
    expect(div?.textContent).toBe('exact')
  })

  it('should not walk children of non-fragment node types', () => {
    const dummyNode = {
      nodeType: 8,
      get firstChild() {
        throw new Error('should not access children of non-fragment node')
      }
    }
    expect(() => walk(dummyNode as any, ctx)).not.toThrow()
  })

  it('should not treat other directives with arg ref as ref directive', () => {
    const fn = vi.fn()
    ctx.scope.handleRef = fn
    container.innerHTML = '<div v-on:ref="handleRef"></div>'
    walk(container, ctx)

    const div = container.querySelector('div')!
    div.dispatchEvent(new CustomEvent('ref'))
    expect(fn).toHaveBeenCalled()
    expect(ctx.scope.$refs.handleRef).toBeUndefined()
  })

  it('should not log error for unknown custom directive when DEV is false', () => {
    const originalDev = import.meta.env.DEV
    ;(import.meta.env as any).DEV = false
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      container.innerHTML = '<div v-unknown="foo"></div>'
      walk(container, ctx)
      expect(errorSpy).not.toHaveBeenCalled()
    } finally {
      ;(import.meta.env as any).DEV = originalDev
      errorSpy.mockRestore()
    }
  })

  it('should clean template tags including attributes and closing tag', () => {
    ctx.scope.tpl = '<template><span>Tpl</span></template>'
    container.innerHTML = '<div v-scope="{ $template: tpl }"></div>'
    walk(container, ctx)

    const div = container.querySelector('div')
    expect(div?.innerHTML).toBe('<span>Tpl</span>')
  })
})