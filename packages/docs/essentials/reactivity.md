# Reactivity APIs

pocket-vue provides two reactivity APIs: `reactive()` and `watchEffect()`. These are the core primitives you need for building reactive applications.

## Usage

When using the CDN build, these APIs are available on the global `PocketVue` object.

```html
<script src="https://unpkg.com/pocket-vue"></script>
<script>
  const { reactive, watchEffect } = PocketVue
</script>
```

When using the ES module build, you can import them from `pocket-vue`.

```javascript
import { reactive, watchEffect } from 'pocket-vue'
```

---

## API Reference

### `reactive(object)`

Returns a reactive proxy of the given object. This is typically used for defining the initial state of your application.

```javascript
const state = reactive({ count: 0 })
```

### `watchEffect(effect)`

Runs a function immediately while reactively tracking its dependencies and re-runs it whenever the dependencies change.

```javascript
const state = reactive({ count: 0 })
watchEffect(() => console.log(state.count)) // prints 0
state.count++ // prints 1
```

---

## Best Practices

- **Use `reactive` for state objects**: This is the most common pattern for defining your application state.
- **Use getters for derived values**: Use JavaScript getters in your reactive objects for computed-like behavior:
  ```javascript
  const state = reactive({
    count: 0,
    get double() {
      return this.count * 2
    }
  })
  ```
- **Use `watchEffect` for side effects**: Use it when you need to react to state changes with side effects like logging, network requests, or DOM manipulation.
