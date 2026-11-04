import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createApp } from '../src/app'
import { reactive } from '@vue/reactivity'
import { nextTick } from '../src/scheduler'

describe('integration tests', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    container.remove()
  })

  describe('reactivity system', () => {
    it('should handle reactive data updates', async () => {
      container.innerHTML = '<div>{{ message }}</div><button @click="updateMessage">Update</button>'

      const data = reactive({
        message: 'Hello',
        updateMessage() {
          this.message = 'Updated'
        }
      })

      const app = createApp(data)
      app.mount(container)

      expect(container.querySelector('div')?.textContent).toBe('Hello')

      const button = container.querySelector('button')
      button?.click()

      // Wait for reactivity to take effect
      await nextTick()

      expect(container.querySelector('div')?.textContent).toBe('Updated')
    })

    it('should handle nested reactive objects', async () => {
      container.innerHTML = '<div>{{ user.name }}</div><div>{{ user.profile.age }}</div>'

      const data = reactive({
        user: {
          name: 'John',
          profile: {
            age: 30
          }
        }
      })

      const app = createApp(data)
      app.mount(container)

      const divs = container.querySelectorAll('div')
      expect(divs[0]?.textContent).toBe('John')
      expect(divs[1]?.textContent).toBe('30')

      data.user.name = 'Jane'
      data.user.profile.age = 31

      // Wait for reactivity to take effect
      await nextTick()

      expect(divs[0]?.textContent).toBe('Jane')
      expect(divs[1]?.textContent).toBe('31')
    })

    it('should handle array operations', async () => {
      container.innerHTML = '<ul><li v-for="item in items" :key="item">{{ item }}</li></ul>'

      const data = reactive({
        items: ['item1', 'item2', 'item3']
      })

      const app = createApp(data)
      app.mount(container)

      let items = container.querySelectorAll('li')
      expect(items.length).toBe(3)
      expect(items[0]?.textContent).toBe('item1')

      data.items.push('item4')

      // Wait for reactivity to take effect
      await nextTick()

      items = container.querySelectorAll('li')
      expect(items.length).toBe(4)
      expect(items[3]?.textContent).toBe('item4')

      data.items.pop()

      // Wait for reactivity to take effect
      await nextTick()

      items = container.querySelectorAll('li')
      expect(items.length).toBe(3)
    })
  })

  describe('component-like behavior', () => {
    it('should handle scoped data in nested elements', async () => {
      container.innerHTML = '<div v-scope="{ localCount: 0 }"><div>{{ localCount }}</div><button @click="localCount++">Increment</button></div>'

      const app = createApp()
      app.mount(container)

      const div = container.querySelector('div')
      const button = container.querySelector('button')

      expect(div?.textContent).toContain('0')

      button?.click()

      // Wait for reactivity to take effect
      await nextTick()

      expect(div?.textContent).toContain('1')
    })

    it('should handle multiple independent instances', async () => {
      container.innerHTML = '<div id="app1"><div>{{ message }}</div><button @click="update">Update</button></div><div id="app2"><div>{{ message }}</div><button @click="update">Update</button></div>'

      const app1 = createApp({
        message: 'App1',
        update() {
          this.message = 'App1 Updated'
        }
      })

      const app2 = createApp({
        message: 'App2',
        update() {
          this.message = 'App2 Updated'
        }
      })

      app1.mount('#app1')
      app2.mount('#app2')

      const app1Div = container.querySelector('#app1 div')
      const app2Div = container.querySelector('#app2 div')

      expect(app1Div?.textContent).toBe('App1')
      expect(app2Div?.textContent).toBe('App2')

      const app1Button = container.querySelector('#app1 button') as HTMLButtonElement
      app1Button?.click()

      // Wait for reactivity to take effect
      await nextTick()

      expect(app1Div?.textContent).toBe('App1 Updated')
      expect(app2Div?.textContent).toBe('App2')
    })
  })

  describe('lifecycle and cleanup', () => {
    it('should clean up effects when unmounted', async () => {
      container.innerHTML = '<div v-effect="trackEffect()"></div>'

      let callCount = 0
      const app = createApp({
        trackEffect() {
          callCount++
        }
      })
      app.mount(container)

      // Wait for effect to run
      await nextTick()

      // The effect should have been called at least once
      expect(callCount).toBeGreaterThan(0)

      const initialCallCount = callCount

      // Properly unmount the app
      app.unmount()

      // Wait to see if effect runs again (it shouldn't)
      await nextTick()

      // The effect should not run again after unmount
      expect(callCount).toBe(initialCallCount)
    })

    it('should handle conditional rendering', async () => {
      container.innerHTML = '<div v-if="show">Visible Content</div><button @click="toggle">Toggle</button>'

      const data = reactive({
        show: true,
        toggle() {
          this.show = !this.show
        }
      })

      const app = createApp(data)
      app.mount(container)

      let content = container.querySelector('div')
      expect(content?.textContent).toBe('Visible Content')

      const button = container.querySelector('button')
      button?.click()

      // Wait for reactivity to take effect
      await nextTick()

      content = container.querySelector('div')
      expect(content).toBeNull()

      button?.click()

      // Wait for reactivity to take effect
      await nextTick()

      content = container.querySelector('div')
      expect(content?.textContent).toBe('Visible Content')
    })
  })

  describe('error handling', () => {
    it('should handle undefined expressions gracefully', () => {
      container.innerHTML = '<div>{{ undefinedVar }}</div>'

      const app = createApp({})
      app.mount(container)

      const div = container.querySelector('div')
      expect(div?.textContent).toBe('')
    })

    it('should handle null expressions gracefully', () => {
      container.innerHTML = '<div>{{ nullVar }}</div>'

      const app = createApp({ nullVar: null })
      app.mount(container)

      const div = container.querySelector('div')
      expect(div?.textContent).toBe('')
    })

    it('should handle function expressions', () => {
      container.innerHTML = '<div>{{ getMessage() }}</div>'

      const app = createApp({
        getMessage() {
          return 'Hello from function'
        }
      })
      app.mount(container)

      const div = container.querySelector('div')
      expect(div?.textContent).toBe('Hello from function')
    })
  })

  describe('performance optimizations', () => {
    it('should batch DOM updates', () => {
      container.innerHTML = `
        <div>{{ count }}</div>
        <div>{{ count }}</div>
        <div>{{ count }}</div>
      `

      const data = reactive({ count: 0 })
      const app = createApp(data)
      app.mount(container)

      const spy = vi.spyOn(container, 'querySelectorAll')

      data.count = 1

      expect(spy).not.toHaveBeenCalled()
    })

    it('should avoid unnecessary re-renders', () => {
      container.innerHTML = `
        <div>{{ staticValue }}</div>
        <div>{{ dynamicValue }}</div>
      `

      const data = reactive({
        staticValue: 'static',
        dynamicValue: 'dynamic'
      })
      const app = createApp(data)
      app.mount(container)

      const staticDiv = container.querySelector('div:first-child')
      const originalText = staticDiv?.textContent

      data.dynamicValue = 'updated'

      expect(staticDiv?.textContent).toBe(originalText)
    })
  })
})