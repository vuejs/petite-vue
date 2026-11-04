# State Management

As your application grows, you may need to share state between multiple components or persist state across page reloads. pocket-vue provides a simple and effective way to manage global state using the `reactive` function.

## The Store Pattern

The simplest way to manage global state is to create a reactive object and share it between your components. This is often called the "Store Pattern".

### 1. Create a Store

Create a JavaScript file (e.g., `store.js`) to hold your global state.

```js
import { reactive } from 'pocket-vue'

export const store = reactive({
  count: 0,
  user: null,
  
  increment() {
    this.count++
  },
  
  setUser(user) {
    this.user = user
  }
})
```

### 2. Use the Store in Components

You can now import this store and use it in your components.

```html
<script type="module">
  import { createApp } from 'pocket-vue'
  import { store } from './store.js'

  createApp({
    store
  }).mount()
</script>

<div v-scope>
  <p>Count: {{ store.count }}</p>
  <button @click="store.increment()">Increment</button>
</div>

<div v-scope>
  <p>Same Count: {{ store.count }}</p>
</div>
```

Because `store` is reactive, any change to `store.count` will automatically update all components that use it.

## Global State with `PocketVue.reactive`

If you are using the CDN build without ES modules, you can still achieve this pattern.

```html
<script src="https://unpkg.com/pocket-vue"></script>

<script>
  const store = PocketVue.reactive({
    count: 0,
    increment() {
      this.count++
    }
  })

  PocketVue.createApp({
    store
  }).mount()
</script>

<div v-scope>
  {{ store.count }}
  <button @click="store.increment()">+</button>
</div>
```

## Persisting State

To persist state across page reloads (e.g., for a dark mode preference), you can use `localStorage` combined with `v-effect` or `watchEffect`.

### Using `v-effect`

```html
<script src="https://unpkg.com/pocket-vue"></script>

<script>
  const store = PocketVue.reactive({
    darkMode: localStorage.getItem('darkMode') === 'true',
    toggleTheme() {
      this.darkMode = !this.darkMode
    }
  })

  PocketVue.createApp({ store }).mount()
</script>

<div v-scope v-effect="
  localStorage.setItem('darkMode', store.darkMode);
  document.body.classList.toggle('dark', store.darkMode)
">
  <button @click="store.toggleTheme()">
    {{ store.darkMode ? 'Dark' : 'Light' }} Mode
  </button>
</div>
```

### Using `watchEffect`

```html
<script type="module">
  import { createApp, reactive, watchEffect } from 'pocket-vue'

  const store = reactive({
    darkMode: localStorage.getItem('darkMode') === 'true',
    toggleTheme() {
      this.darkMode = !this.darkMode
    }
  })

  // React to darkMode changes and persist
  watchEffect(() => {
    localStorage.setItem('darkMode', store.darkMode)
    document.body.classList.toggle('dark', store.darkMode)
  })

  createApp({ store }).mount()
</script>

<div v-scope>
  <button @click="store.toggleTheme()">
    {{ store.darkMode ? 'Dark' : 'Light' }} Mode
  </button>
</div>
```

> [!TIP]
> `watchEffect` and `v-effect` both run immediately and then re-run whenever any reactive dependency changes. This makes them perfect for side effects like saving to `localStorage`.
