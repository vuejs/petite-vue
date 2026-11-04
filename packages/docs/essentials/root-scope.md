# Root Scope

The `createApp` function accepts a data object that serves as the root scope for all expressions. This is useful for bootstrapping simple apps or sharing state.

## Defining Root Scope

```js
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
```

## Usage in Template

Properties defined in the root scope are available in all templates within the mounted app:

```html
<div v-scope>
  <p>Count: {{ count }}</p>
  <p>Plus One: {{ plusOne }}</p>
  <button @click="increment">Increment</button>
</div>
```

Note that when using a root scope, `v-scope` doesn't need a value; it just marks the element as a pocket-vue region.
