# $refs

An object holding DOM elements that have the `ref` attribute registered.

## Usage

```html
<div v-scope>
  <input ref="input">
  <button @click="$refs.input.focus()">
    Focus Input
  </button>
</div>
```

## Details

Refs are populated when their elements are initialized. They are not reactive, so you should not use them in templates for data binding. A ref on an element with `v-scope` stores the DOM element, not a component instance or scope object.
