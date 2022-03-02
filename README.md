# petite-vue

`petite-vue` is an alternative distribution of [Vue](https://vuejs.org) optimized for [progressive enhancement](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement). It provides the same template syntax and reactivity mental model as standard Vue. However, it is specifically optimized for "sprinkling" a small amount of interactions on an existing HTML page rendered by a server framework. See more details on [how it differs from standard Vue](#comparison-with-standard-vue).

- Only ~6kb
- Vue-compatible template syntax
- DOM-based, mutates in place
- Driven by `@vue/reactivity`

## Status

- This is pretty new. There are probably bugs and there might still be API changes, so **use at your own risk.** Is it usable though? Very much. Check out the [examples](https://github.com/vuejs/petite-vue/tree/main/examples) to see what it's capable of.

- The issue list is intentionally disabled because I have higher priority things to focus on for now and don't want to be distracted. If you found a bug, you'll have to either workaround it or submit a PR to fix it yourself. That said, feel free to use the discussions tab to help each other out.

- Feature requests are unlikely to be accepted at this time - the scope of this project is intentionally kept to a bare minimum.

## Usage

`petite-vue` can be used without a build step. Simply load it from a CDN:

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
  PetiteVue.createApp().mount()
</script>
```

Or, use the ES module build:

```html
<script type="module">
  import { createApp } from 'https://unpkg.com/petite-vue?module'
  createApp().mount()
</script>
```

### Production CDN URLs

The short CDN URL is meant for prototyping. For production usage, use a fully resolved CDN URL to avoid resolving and redirect cost:

- Global build: `https://unpkg.com/petite-vue@0.4.1/dist/petite-vue.iife.js`
  - exposes `PetiteVue` global, supports auto init
- ESM build: `https://unpkg.com/petite-vue@0.4.1/dist/petite-vue.es.js`
  - Must be used with `<script type="module">`

### Root Scope

The `createApp` function accepts a data object that serves as the root scope for all expressions. This can be used to bootstrap simple, one-off apps:

```html
<script type="module">
  import { createApp } from 'https://unpkg.com/petite-vue?module'

  createApp({
    // exposed to all expressions
    count: 0,
    // getters
    get plusOne() {
      return this.count + 1
    },
    // methods
    increment() {
      this.count++
    }
  }).mount()
</script>

<!-- v-scope value can be omitted -->
<div v-scope>
  <p>{{ count }}</p>
  <p>{{ plusOne }}</p>
  <button @click="increment">increment</button>
</div>
```

Note `v-scope` doesn't need to have a value here and simply serves as a hint for `petite-vue` to process the element.

### Explicit Mount Target

You can specify a mount target (selector or element) to limit `petite-vue` to only that region of the page:

```js
createApp().mount('#only-this-div')
```

This also means you can have multiple `petite-vue` apps to control different regions on the same page:

```js
createApp({
  // root scope for app one
}).mount('#app1')

createApp({
  // root scope for app two
}).mount('#app2')
```

### Lifecycle Events

You can listen to the special `vue:mounted` and `vue:unmounted` lifecycle events for each element (the `vue:` prefix is required since v0.4.0):

```html
<div
  v-if="show"
  @vue:mounted="console.log('mounted on: ', $el)"
  @vue:unmounted="console.log('unmounted: ', $el)"
></div>
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

Another example of replacing the `todo-focus` directive found in the original Vue TodoMVC example:

```html
<input v-effect="if (todo === editedTodo) $el.focus()" />
```

### Components

The concept of "Components" are different in `petite-vue`, as it is much more bare-bones.

First, reusable scope logic can be created with functions:

```html
<script type="module">
  import { createApp } from 'https://unpkg.com/petite-vue?module'

  function Counter(props) {
    return {
      count: props.initialCount,
      inc() {
        this.count++
      },
      mounted() {
        console.log(`I'm mounted!`)
      }
    }
  }

  createApp({
    Counter
  }).mount()
</script>

<div v-scope="Counter({ initialCount: 1 })" @vue:mounted="mounted">
  <p>{{ count }}</p>
  <button @click="inc">increment</button>
</div>

<div v-scope="Counter({ initialCount: 2 })">
  <p>{{ count }}</p>
  <button @click="inc">increment</button>
</div>
```

### Components with Template

If you also want to reuse a piece of template, you can provide a special `$template` key on a scope object. The value can be the template string, or an ID selector to a `<template>` element:

```html
<script type="module">
  import { createApp } from 'https://unpkg.com/petite-vue?module'

  function Counter(props) {
    return {
      $template: '#counter-template',
      count: props.initialCount,
      inc() {
        this.count++
      }
    }
  }

  createApp({
    Counter
  }).mount()
</script>

<template id="counter-template">
  My count is {{ count }}
  <button @click="inc">++</button>
</template>

<!-- reuse it -->
<div v-scope="Counter({ initialCount: 1 })"></div>
<div v-scope="Counter({ initialCount: 2 })"></div>
```

The `<template>` approach is recommended over inline strings because it is more efficient to clone from a native template element.

### Global State Management

You can use the `reactive` method (re-exported from `@vue/reactivity`) to create global state singletons:

```html
<script type="module">
  import { createApp, reactive } from 'https://unpkg.com/petite-vue?module'

  const store = reactive({
    count: 0,
    inc() {
      this.count++
    }
  })

  // manipulate it here
  store.inc()

  createApp({
    // share it with app scopes
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

### Custom Delimiters (0.3+)

You can use custom delimiters by passing `$delimiters` to your root scope. This is useful when working alongside a server-side templating language that also uses mustaches:

```js
createApp({
  $delimiters: ['${', '}']
}).mount()
```

## Examples

Check out the [examples directory](https://github.com/vuejs/petite-vue/tree/main/examples).

## Features

### `petite-vue` only

- `v-scope`
- `v-effect`
- `@vue:mounted` & `@vue:unmounted` events

### Has Different Behavior

- In expressions, `$el` points to the current element the directive is bound to (instead of component root element)
- `createApp()` accepts global state instead of a component
- Components are simplified into object-returning functions
- Custom directives have a different interface

### Vue Compatible

- `{{ }}` text bindings (configurable with custom delimiters)
- `v-bind` (including `:` shorthand and class/style special handling)
- `v-on` (including `@` shorthand and all modifiers)
- `v-model` (all input types + non-string `:value` bindings)
- `v-if` / `v-else` / `v-else-if`
- `v-for`
- `v-show`
- `v-html`
- `v-text`
- `v-pre`
- `v-once`
- `v-cloak`
- `reactive()`
- `nextTick()`
- Template refs

### Not Supported

Some features are dropped because they have a relatively low utility/size ratio in the context of progressive enhancement. If you need these features, you should probably just use standard Vue.

- `ref()`, `computed()` etc.
- Render functions (`petite-vue` has no virtual DOM)
- Reactivity for Collection Types (Map, Set, etc., removed for smaller size)
- Transition, KeepAlive, Teleport, Suspense
- `v-for` deep destructure
- `v-on="object"`
- `v-is` & `<component :is="xxx">`
- `v-bind:style` auto-prefixing

## Comparison with standard Vue

The point of `petite-vue` is not just about being small. It's about using the optimal implementation for the intended use case (progressive enhancement).

Standard Vue can be used with or without a build step. When using a build setup (e.g. with Single-File Components), we pre-compile all the templates so there's no template processing to be done at runtime. And thanks to tree-shaking, we can ship optional features in standard Vue that doesn't bloat your bundle size when not used. This is the optimal usage of standard Vue, but since it involves a build setup, it is better suited when building SPAs or apps with relatively heavy interactions.

When using standard Vue without a build step and mounting to in-DOM templates, it is much less optimal because:

- We have to ship the Vue template compiler to the browser (13kb extra size)
- The compiler will have to retrieve the template string from already instantiated DOM
- The compiler then compiles the string into a JavaScript render function
- Vue then replaces existing DOM templates with new DOM generated from the render function.

`petite-vue` avoids all this overhead by walking the existing DOM and attaching fine-grained reactive effects to the elements directly. The DOM _is_ the template. This means `petite-vue` is much more efficient in progressive enhancement scenarios.

This is also how Vue 1 worked. The trade-off here is that this approach is coupled to the DOM and thus not suitable for platform agnostic rendering or JavaScript SSR. We also lose the ability to work with render functions for advanced abstractions. However as you can probably tell, these capabilities are rarely needed in the context of progressive enhancement.

## Comparison with Alpine

`petite-vue` is indeed addressing a similar scope to [Alpine](https://alpinejs.dev), but aims to be (1) even more minimal and (2) more Vue-compatible.

- `petite-vue` is around half the size of Alpine.

- `petite-vue` has no transition system (maybe this can be an opt-in plugin).

- Although Alpine largely resembles Vue's design, there are various cases where the behavior is different from Vue itself. It may also diverge more from Vue in the future. This is good because Alpine shouldn't have to restrict its design to strictly follow Vue - it should have the freedom to develop in a direction that makes sense for its goals.

  In comparison, `petite-vue` will try to align with standard Vue behavior whenever possible so that there is less friction moving to standard Vue if needed. It's intended to be **part of the Vue ecosystem** to cover the progressive enhancement use case where standard Vue is less optimized for nowadays.

## Security and CSP

`petite-vue` evaluates JavaScript expressions in the templates. This means **if** `petite-vue` is mounted on a region of the DOM that contains non-sanitized HTML from user data, it may lead to XSS attacks. **If your page renders user-submitted HTML, you should prefer initializing `petite-vue` using [explicit mount target](#explicit-mount-target) so that it only processes parts that are controlled by you**. You can also sanitize any user-submitted HTML for the `v-scope` attribute.

`petite-vue` evaluates the expressions using `new Function()`, which may be prohibited in strict CSP settings. There is no plan to provide a CSP build because it involves shipping an expression parser which defeats the purpose of being lightweight. If you have strict CSP requirements, you should probably use standard Vue and pre-compile the templates.

## License

MIT
