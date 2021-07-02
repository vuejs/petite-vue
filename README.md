# petite-vue

`petite-vue` is an alternative distribution of Vue optimized for progressive enhancement. It provides the same template syntax and reactivity mental model with standard Vue. However, it is specifically optimized for "sprinkling" small amount of interactions on an existing HTML page rendered by a server framework.

- Only 5.5kb
- DOM-based, mutates in place
- Driven by `@vue/reactivity`

## Usage

```html
<script src="https://unpkg.com/petite-vue" defer init></script>

<!-- anywhere on the page -->
<div v-scope="{ count: 0 }">
  {{ count }}
  <button @click="count++">inc</button>
</div>
```

- Use `v-scope` to mark regions on the page that should be controlled by `petite-vue`.
- The `defer` attribute makes the script execute after HTML content is parsed.
- The `init` attribute tells `petite-vue` to automatically query and initialize all elements that have `v-scope` on the page.

### Manual Init

If you don't want the auto init, remove the `init` attribute and move the scripts to end of `<body>`:

```html
<script src="https://unpkg.com/petite-vue"></script>
<script>
  PetiteVue.createapp().mount()
</script>
```

Or, use the ES modules build:

```html
<script type="module">
  import { createApp } from 'https://unpkg.com/petite-vue?module'
  createApp().mount()
<script>
```

### `v-init`

Use `v-init` to execute one-off inline statements when an element is processed:

```html
<div id="foo" v-init="console.log($el.id)"></div>
```

### `v-effect`

Use `v-effect` to execute **reactive** inline statements:

```html
<div v-scope="{ count: 0 }">
  <div v-effect="$el.textContent = count"></div>
  <button @click="count++">++</button>
</div>
```

The effect uses `count` which is a reactive data source, so it will re-run whenever `count` changes.

### Global Data

The `createApp` function accepts a data object that serves as the root scope for all expressions. This can be used for simple global state management:

```html
<script type="module">
  import { createApp, reactive } from 'https://unpkg.com/petite-vue?module'

  const store = reactive({
    count: 0,
    inc() {
      this.count++
    }
  })

  createApp({
    // exposed to all expressions
    store
  }).mount()
</script>

<div v-scope="{ localCount: 0 }">
  <p>Global {{ store.count }}</p>
  <button @click="store.inc">increment</button>

  <p>Local {{ localCount }}</p>
  <button @click="localCount++">increment</button>
</div>
```

### Reusing Logic

There are no components, but logic can be shared across the app or encapsulated in setup-like functions:

```html
<script type="module">
  import { createApp } from 'https://unpkg.com/petite-vue?module'

  function ComponentLike(props) {
    return {
      count: props.initialCount,
      inc() {
        this.count++
      }
    }
  }

  createApp({
    ComponentLike
  }).mount()
</script>

<div v-scope="ComponentLike({ initialCount: 10 })">
  <p>{{ count }}</p>
  <button @click="inc">increment</button>
</div>
```

### Custom Directives

Custom directives are also supported but with a different interface:

```js
const myDirective = (ctx) => {
  // the element the directive is on
  ctx.el
  // the raw value expression
  // e.g. v-my-dir="x" then this would be "x"
  ctx.exp
  // v-my-dir:foo -> "foo"
  ctx.arg
  // v-my-dir.mod -> { mod: true }
  ctx.modifiers
  // evaluate the expression and get its value
  ctx.get()
  // evaluate arbitrary expression in current scope
  ctx.get(`${ctx.exp} + 10`)

  // run reactive effect
  ctx.effect(() => {
    // this will re-run every time the get() value changes
    console.log(ctx.get())
  })

  return () => {
    // cleanup if the element is unmounted
  }
}

// register the directive
createApp().directive('my-dir', myDirective).mount()
```

This is how `v-html` is implemented:

```js
const html = ({ el, get, effect }) => {
  effect(() => {
    el.innerHTML = get()
  })
}
```

## Features

### `petite-vue` only

- `v-scope`
- `v-init`
- `v-effect`

### Has Different Behavior

- `createApp()` (accepts global state instead of root component)
- Custom directives

### Vue Compatible

- `{{ }}` text bindings
- `v-bind` (including `:` shorthand and class/style special handling)
- `v-on` (including `@` shorthand and all modifiers)
- `v-model` (all input types + non-string `:value` bindings)
- `v-if` / `v-else` / `v-else-if`
- `v-for`
- `v-show`
- `v-html`
- `v-text`
- `v-pre`
- `v-cloak`
- `reactive()`
- `nextTick()`

### Not Supported

Some features are dropped because they have a relatively low size/utility ratio in the context of progressive enhancement. If you need these features, you should probably just use standard Vue.

- `ref()`, `computed()` etc.
- Components (see "Reuse Logic" section above)
- Template refs (just use selectors)
- Render functions (`petite-vue` has no virtual DOM)
- Reactivity for Collection Types (Map, Set, etc., removed for smaller size)
- Transition, KeepAlive, Teleport, KeepAlive
- `v-for` deep destructure
- `v-on="object"`
- `v-once`
- `v-is` & `<component :is="xxx">`
- `v-bind:style` auto-prefixing

## Relationship with Alpine

- This is indeed addressing a similar scope to Alpine, but aims to be even more minimal.
  - `petite-vue` is less than half the size of Alpine.
  - `petite-vue` has no transition system (maybe this can be an opt-in plugin).
- Alpine is developing its own ecosystem and likely will diverge more from Vue in the future. `petite-vue` aligns with standard Vue behavior whenever possible, so it's less friction moving to standard Vue if needed. It's intended to cover the progressive enhancement use case where standard Vue is less optimized for nowadays.
