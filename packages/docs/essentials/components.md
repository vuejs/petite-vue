# Components

In pocket-vue, components are simplified compared to standard Vue. They are primarily functions that return a scope object.

## Function Components

Reusable scope logic can be created with functions:

```js
function Counter(props) {
  return {
    count: props.initialCount,
    inc() {
      this.count++
    },
    onMounted() {
      console.log(`I'm mounted!`)
    }
  }
}

createApp({
  Counter
}).mount()
```

## Usage

Use the function in `v-scope` to instantiate the component:

```html
<div v-scope="Counter({ initialCount: 1 })" @vue:mounted="onMounted">
  <p>{{ count }}</p>
  <button @click="inc">increment</button>
</div>

<div v-scope="Counter({ initialCount: 2 })">
  <p>{{ count }}</p>
  <button @click="inc">increment</button>
</div>
```

> [!NOTE]
> pocket-vue does **not** have automatic lifecycle hooks like `mounted()` or `setup()`. To run code when a component is mounted, define a method in your scope and wire it up manually using `@vue:mounted="methodName"`. See [Lifecycle Events](../essentials/lifecycle.md) for details.

## Components with Template

If you want to reuse a piece of template, you can provide a special `$template` key on the scope object. The value can be an ID selector to a `<template>` element:

```js
function Counter(props) {
  return {
    $template: '#counter-template',
    count: props.initialCount,
    inc() {
      this.count++
    }
  }
}
```

```html
<template id="counter-template">
  My count is {{ count }}
  <button @click="inc">++</button>
</template>

<!-- reuse it -->
<div v-scope="Counter({ initialCount: 1 })"></div>
<div v-scope="Counter({ initialCount: 2 })"></div>
```

The `<template>` approach is recommended over inline strings because it is more efficient to clone from a native template element.

## Organizing Code

For larger projects, it's best to keep your component logic in separate JavaScript files.

`components/Counter.js`:
```js
export default function Counter(props) {
  return {
    count: props.initialCount || 0,
    inc() { this.count++ },
    dec() { this.count-- }
  }
}
```

`index.html`:
```html
<script type="module">
  import { createApp } from 'https://unpkg.com/pocket-vue?module'
  import Counter from './components/Counter.js'

  createApp({
    Counter
  }).mount()
</script>

<div v-scope="Counter({ initialCount: 10 })">
  ...
</div>
```

