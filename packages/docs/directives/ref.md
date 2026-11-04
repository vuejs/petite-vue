# ref

Register a reference to a DOM element.

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

The `ref` attribute stores the current DOM element on the `$refs` object of the current scope.

Refs are populated when the element is initialized. They are not reactive, so do not use them as template data dependencies.

```html
<div v-scope>
  <input ref="input">
  <button @click="$refs.input.value = ''">Clear</button>
</div>
```

## Dynamic refs

Use `:ref` when the ref name should come from scope data.

```html
<div v-scope="{ currentRef: 'primaryInput' }">
  <input :ref="currentRef">
  <button @click="$refs.primaryInput.focus()">Focus</button>
</div>
```

When the ref expression changes, pocket-vue removes the old ref name and stores the element under the new name.

## Refs on `v-scope` elements

If `ref` is used on an element that also has `v-scope`, `$refs` stores that DOM element. It does not store a component instance or the scope object.

```html
<div v-scope="{ count: 0 }" ref="counterEl">
  Count: {{ count }}
</div>
```

To expose behavior, call methods through events or shared scope data rather than expecting `$refs.counterEl` to be a component API.
