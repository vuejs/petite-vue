# v-effect

`v-effect` is used to run a reactive side effect. It's pocket-vue's equivalent of `watchEffect()` but as an inline directive.

## Basic Usage

```html
<div v-scope="{ count: 0 }">
  <div v-effect="$el.textContent = 'Count is: ' + count"></div>
  <button @click="count++">Increment</button>
</div>
```

The expression inside `v-effect` is executed immediately, and re-executed whenever any reactive dependencies it accesses change.

---

## Reactive Expressions

`v-effect` automatically tracks any reactive state accessed within its expression. If you use a `ref` or a property from a `reactive` object, the effect will re-run whenever those values change.

```html
<div v-scope="{ a: 1, b: 1 }">
  <p v-effect="console.log('Sum is:', a + b)">
    Sum of {{ a }} + {{ b }} is computed in the console.
  </p>
  <button @click="a++">Change A</button>
  <button @click="b++">Change B</button>
</div>
```

---

## JavaScript Support

`v-effect` supports JavaScript statements and expressions, including conditionals, function calls, and template literals, subject to pocket-vue's unsafe-expression validation. For example, direct references to globals such as `window`, `document`, or `fetch` are rejected in template expressions.

```html
<div v-scope="{ show: true, msg: 'Hello' }">
  <div v-effect="show ? $el.textContent = msg : $el.textContent = 'Hidden'"></div>
</div>
```

### Accessing DOM Elements

`v-effect` has access to special variables:

- **`$el`**: The current element the directive is on. Also available in other directives (`v-on`, `v-bind`, etc.).

```html
<!-- $el: access the current element -->
<input v-effect="if (shouldFocus) $el.focus()">
```

---

## Edge Cases and Limitations

### 1. Synchronous Execution
`v-effect` runs synchronously after the next tick. While efficient, avoid placing heavy computations directly in the template. For complex logic, consider using a method in your scope.

### 2. Infinite Loops
Be careful not to modify the same reactive state that the effect depends on, as this can trigger an infinite loop.

```html
<!-- BAD: This will cause an infinite loop -->
<div v-effect="count++"></div>
```

### 3. Cleanup
Unlike `watchEffect`, `v-effect` in pocket-vue doesn't provide an explicit `onCleanup` callback. However, all effects are automatically stopped when the element is removed from the DOM (e.g., via `v-if`).

### 4. Direct DOM Mutation
While you can use `v-effect` to mutate the DOM directly (like setting `innerHTML` or `className`), it's generally better to use built-in directives like `v-html` or `:class` for these purposes whenever possible. Use `v-effect` for things that don't have a dedicated directive.

