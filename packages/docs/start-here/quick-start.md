# Quick Start

pocket-vue is a lightweight, progressive-first JavaScript framework that enables developers to add client-side interactivity to server-rendered applications without the overhead of a full Single Page Application (SPA) framework.

## What is pocket-vue?

pocket-vue is a fork of [petite-vue](https://github.com/vuejs/petite-vue), optimized for **Progressive Enhancement**. It provides the same template syntax and reactivity mental model as standard Vue, but is specifically optimized for "sprinkling" small amounts of interactions on existing HTML pages.

### Key Benefits

- **Lightweight**: Only ~9kb gzipped.
- **No Build Step**: Works directly in the browser with a `<script>` tag.
- **Vue-Compatible**: Uses familiar Vue syntax (`v-if`, `v-for`, `@click`, etc.).
- **Progressive**: Designed to layer on top of your existing HTML.

---

## Comparison with full Vue

| Feature | pocket-vue | Standard Vue |
|---------|-----------|--------------|
| Target Use Case | Progressive Enhancement | Single Page Application (SPA) |
| Runtime Size | ~9kb | ~44kb+ |
| Virtual DOM | No (uses real DOM) | Yes |
| Build Required | No | Recommended |
| Scoped CSS | No | Yes (SFC) |
| SSR Support | No (it is the client-side enhancement) | Yes |

---

## Basic Example

```html
<script src="https://unpkg.com/pocket-vue" defer init></script>

<div v-scope="{ count: 0 }">
  <button @click="count--">-</button>
  <span>{{ count }}</span>
  <button @click="count++">+</button>
</div>
```

## Interactive Example: Toggle

Here is a common pattern: toggling visibility of an element.

```html
<div v-scope="{ open: false }">
  <button @click="open = !open">
    {{ open ? 'Close' : 'Open' }} Content
  </button>

  <div v-show="open" class="content">
    <p>This content is toggled!</p>
  </div>
</div>
```

## How it works

1. **Load the script**: The `<script>` tag loads pocket-vue from a CDN. The `defer` attribute ensures it runs after the HTML is parsed. The `init` attribute tells it to automatically find and mount components.

2. **Define Scope**: `v-scope="{ count: 0 }"` marks the `<div>` as a component and initializes its state with `count` set to 0. This state is **reactive** — if it changes, the UI updates automatically.

3. **Bind Events**: `@click="count--"` and `@click="count++"` are event listeners that modify the state.

4. **Display Data**: `{{ count }}` displays the current value of `count`.

## Next Steps

- Learn more about [v-scope](../essentials/v-scope.md)
- Explore [Directives](../directives/index.md)
- Try the [Examples](../examples/index.md)
