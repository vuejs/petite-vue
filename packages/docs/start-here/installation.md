# Installation

pocket-vue is designed to be used without a build step. You can simply load it from a CDN.

## CDN

### Unpkg

```html
<script src="https://unpkg.com/pocket-vue" defer init></script>
```

### jsDelivr

```html
<script src="https://cdn.jsdelivr.net/npm/pocket-vue" defer init></script>
```

### esm.sh

```html
<script type="module">
  import { createApp } from 'https://esm.sh/pocket-vue'
  createApp().mount()
</script>
```

> [!TIP] Production Tip
> For production, it is recommended to pin a specific version number to avoid unexpected breakage from newer versions.
> ```html
> <script src="https://unpkg.com/pocket-vue@0.0.4" defer init></script>
> ```

## Auto Initialization

The `init` attribute on the script tag tells pocket-vue to automatically query and initialize all elements that have `v-scope` on the page.

```html
<script src="https://unpkg.com/pocket-vue" defer init></script>
```

## Manual Initialization

If you don't want the auto init, remove the `init` attribute and move the scripts to end of `<body>`:

```html
<script src="https://unpkg.com/pocket-vue"></script>
<script>
  PocketVue.createApp().mount()
</script>
```

Or, use the ES module build:

```html
<script type="module">
  import { createApp } from 'https://unpkg.com/pocket-vue?module'
  createApp().mount()
</script>
```

## NPM

You can also install pocket-vue via npm:

```bash
npm install pocket-vue
```

Then import it in your project:

```js
import { createApp } from 'pocket-vue'
createApp().mount()
```

## Troubleshooting

### Content Security Policy (CSP)

If you are using a strict CSP, you might run into issues because pocket-vue uses `new Function()` to evaluate expressions. You may need to add `'unsafe-eval'` to your `script-src` policy.

### Loading Order

Always use `defer` when loading pocket-vue in the `<head>` to ensure the DOM is ready before pocket-vue tries to initialize. If you put the script at the end of `<body>`, `defer` is not strictly necessary but still good practice.
