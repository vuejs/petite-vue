# petite-vue (WIP)

A subset of Vue optimized for progressive enhancement.

- ~6kb w/ most non-component features
- DOM-based, mutates in place
- Driven by `@vue/reactivity`

## Usage

```html
<script type="module">
  import { createApp } from 'petite-vue'
  createApp().mount()
</script>

<div v-scope="{ text: 'hello', open: true }">
  {{ text }}
  <input v-model="text" v-if="open" />
  <button @click="open = !open">toggle</button>
</div>
```

### Reusing Logic

There are no components, but logic can be shared across the app or encapsulated in setup-like functions:

```html
<script type="module">
  import { createApp, reactive } from 'petite-vue'

  const store = reactive({
    count: 0,
    inc() {
      this.count++
    }
  })

  function ComponentLike(count) {
    return {
      count,
      inc() {
        this.count++
      }
    }
  }

  createApp({
    // exposed to all expressions
    store,
    ComponentLike
  }).mount()
</script>

<div v-scope="ComponentLike(10)">
  <p>Global {{ store.count }}</p>
  <button @click="store.inc">increment</button>

  <p>Local {{ count }}</p>
  <button @click="inc">increment</button>
</div>
```

## Differences

Custom directive interface is different. (TODO document)

## Not Supported

- `ref`
- Reactivity for Collection Types (Map, Set, etc.)
- Components
- Transition, KeepAlive, Teleport, KeepAlive
- `v-on` object syntax
- `v-once`
- `v-is`
- style auto-prefixing
