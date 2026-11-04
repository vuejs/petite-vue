# $nextTick

A utility to wait for the next DOM update cycle.

## Usage

```html
<div v-scope="{ count: 0 }">
  <div ref="counter">{{ count }}</div>
  <button @click="
    count++;
    $nextTick(() => {
      console.log($refs.counter.textContent) // logs updated value
    })
  ">
    Increment
  </button>
</div>
```

## Details

When you mutate state in pocket-vue, the DOM updates asynchronously. If you need to perform an operation that depends on the updated DOM, use `$nextTick`.

### Async Update Queue

pocket-vue buffers all state changes and flushes them together in the next "tick". This ensures that you don't trigger unnecessary re-renders if you change the same data multiple times.

```js
count = 1
count = 2
count = 3
// DOM updates only once with 3
```

