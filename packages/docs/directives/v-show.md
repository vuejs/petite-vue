# v-show

`v-show` toggles the visibility of an element by manipulating its CSS `display` property.

## Basic Usage

```html
<div v-scope="{ ok: true }">
  <h1 v-show="ok">Hello!</h1>
  <button @click="ok = !ok">Toggle Visibility</button>
</div>
```

---

## Behavior

`v-show` works by adding an inline `display: none` style to the element when the expression is false. When the expression is true, it restores the element's original `display` value (either from an existing inline style or the default for that element type).

### Preservation of Initial State
pocket-vue intelligently stores the initial `display` property of your element when the application is mounted. This means if your element was originally `display: flex` or `display: inline-block`, `v-show` will correctly restore that state.

---

## Comparison with `v-if`

While `v-if` and `v-show` both conditionally control visibility, they have different trade-offs:

| Feature | `v-if` | `v-show` |
|---------|--------|----------|
| **DOM Persistence** | Element is added/removed from DOM | Element is **always** in the DOM |
| **Initial Render Cost** | Low (only renders when true) | High (always renders everything) |
| **Toggle Cost** | High (must re-run templates and hooks) | Low (just a CSS property change) |
| **Supports `<template>`** | Yes | No |
| **Supports `v-else`** | Yes | No |

---

## Performance Considerations

### When to use `v-show`
Use `v-show` for elements that need to be toggled frequently (e.g., dropdowns, tooltips, tabs, or menus). Since the element is already rendered, toggling is near-instantaneous and doesn't trigger expensive template processing or component lifecycle hooks.

### When to avoid `v-show`
Avoid `v-show` for large, complex sections of your page that are rarely shown. For these cases, `v-if` is better because it prevents the initial rendering and reduces the memory footprint of your application.

---

## Use Case Examples

### Interactive Search Filter
`v-show` is perfect for filtering lists in real-time, as it avoids re-creating DOM nodes for every keystroke.

```html
<div v-scope="{ query: '', items: ['Apple', 'Banana', 'Cherry'] }">
  <input v-model="query" placeholder="Search...">
  <ul>
    <li v-for="item in items" v-show="item.toLowerCase().includes(query.toLowerCase())">
      {{ item }}
    </li>
  </ul>
</div>
```

### Tabbed Interface
Easily toggle between multiple content sections.

```html
<div v-scope="{ activeTab: 'tab1' }">
  <nav>
    <button @click="activeTab = 'tab1'">Tab 1</button>
    <button @click="activeTab = 'tab2'">Tab 2</button>
  </nav>

  <div v-show="activeTab === 'tab1'">Content 1</div>
  <div v-show="activeTab === 'tab2'">Content 2</div>
</div>
```
