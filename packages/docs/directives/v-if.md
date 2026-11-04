# v-if

`v-if` is used to conditionally render an element based on the truthiness of an expression.

## Basic Usage

```html
<div v-scope="{ ok: true }">
  <p v-if="ok">Now you see me!</p>
  <button @click="ok = !ok">Toggle</button>
</div>
```

---

## v-else-if and v-else

You can chain `v-else-if` and `v-else` to handle multiple conditions. These directives **must** be placed immediately after a `v-if` or another `v-else-if` element.

```html
<div v-scope="{ type: 'A' }">
  <div v-if="type === 'A'">Type is A</div>
  <div v-else-if="type === 'B'">Type is B</div>
  <div v-else>Other</div>
  
  <button @click="type = 'A'">A</button>
  <button @click="type = 'B'">B</button>
  <button @click="type = 'C'">Other</button>
</div>
```

---

## Conditional Blocks with `<template>`

Use a `<template>` tag if you need to wrap multiple elements without adding an extra `<div>` to the DOM.

```html
<template v-if="ok">
  <h1>Title</h1>
  <p>Paragraph 1</p>
  <p>Paragraph 2</p>
</template>
```

---

## v-if vs v-show

While both directives conditionally control what is displayed on the screen, they behave differently:

| Directive | Behavior | Use Case |
|-----------|----------|----------|
| `v-if` | **Lazy**: Element is only created/destroyed when the condition changes. | Condition rarely changes at runtime. |
| `v-show` | **Always Rendered**: Element is always in the DOM, but toggles CSS `display`. | Frequent toggling. |

### Why use `v-if`?
`v-if` has lower initial render cost but higher toggle cost. Use it when you have complex sections of your page that are only needed occasionally.

---

## Best Practices

### 1. Unique Keys for Toggling
When using `v-if` to toggle between similar elements, providing a unique `:key` can help pocket-vue track them accurately.

### 2. Don't Combine with `v-for`
It's generally not recommended to use `v-if` and `v-for` on the same element. In pocket-vue, `v-for` has a higher priority, meaning the `v-if` will be evaluated for each iteration. For performance, it's better to filter the list in your data scope before iterating.

### 3. Avoid Empty Expressions
In development mode, pocket-vue will warn you if a `v-if` expression is empty or invalid.
