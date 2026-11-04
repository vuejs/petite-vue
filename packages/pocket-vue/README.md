# pocket-vue

[![npm version](https://img.shields.io/npm/v/pocket-vue.svg)](https://www.npmjs.com/package/pocket-vue)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A maintained fork of [petite-vue](https://github.com/vuejs/petite-vue) — an ultra-lightweight distribution of [Vue](https://vuejs.org) optimized for progressive enhancement. It provides the same template syntax and reactivity mental model as standard Vue, without the overhead of a full SPA.

> **Note:** petite-vue is no longer maintained. pocket-vue picks up where it left off with bug fixes and feature requests.

## Why pocket-vue?

- **~9kb gzipped** — drop it in, no build step required
- **Vue-compatible** — same template syntax and reactivity you already know
- **Progressive enhancement first** — layer interactivity onto existing server-rendered pages
- **Framework friendly** — works with Django, Rails, Laravel, ASP.NET, or any server-side setup

## Quick Start

```html
<script src="https://unpkg.com/pocket-vue" defer init></script>

<div v-scope="{ count: 0 }">
  {{ count }}
  <button @click="count++">Increment</button>
</div>
```

### CDN

```html
<script src="https://unpkg.com/pocket-vue"></script>
<!-- or -->
<script src="https://cdn.jsdelivr.net/npm/pocket-vue"></script>
```

### npm

```bash
npm install pocket-vue
```

```js
import { createApp } from 'pocket-vue'
```

## Installation

For detailed setup instructions, bundle options, and usage with various frameworks, see the [full documentation](https://pocket-vue.byrush.me/start-here/installation).

## Features

| Directive      | Description                        |
| -------------- | ---------------------------------- |
| `v-scope`      | Declare reactive state             |
| `v-model`      | Two-way data binding               |
| `v-if` / `v-else` | Conditional rendering           |
| `v-for`        | List rendering                     |
| `v-on` / `@`   | Event handling                     |
| `v-bind` / `:` | Attribute binding                  |
| `v-text`       | Text content binding               |
| `v-html`       | Inner HTML binding                 |
| `v-show`       | Toggle visibility                  |
| `v-effect`     | Reactive side effects              |

## Documentation

Full documentation, guides, and API reference are available at [pocket-vue.byrush.me](https://pocket-vue.byrush.me).

To run the docs locally:

```bash
pnpm docs:dev
```

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
