# createApp() API

`createApp()` is the main entry point for creating a pocket-vue application instance.

## Usage

### Simple Initialization

```javascript
import { createApp } from 'pocket-vue'

const app = createApp({
  count: 0,
  increment() {
    this.count++
  }
})

app.mount('#app')
```

### Script Tag Inclusion

When using the CDN build, `createApp` is available on the global `PocketVue` object.

```html
<script src="https://unpkg.com/pocket-vue"></script>
<script>
  const { createApp } = PocketVue
  createApp({ count: 0 }).mount('#app')
</script>
```

---

## API Reference

### `createApp(initialData?: object)`

Creates a new application instance.

- **`initialData`**: An optional object that defines the initial state of the application. This state is made reactive using Vue's reactivity system.

**Returns:** An application instance object.

---

## Instance Methods

### `app.mount(el?: string | Element | null)`

Mounts the application to the DOM and returns the app instance. If a selector string does not match any element, it logs a development warning and returns `undefined`.

- **`el`**: An optional selector string, `Element`, or `null`. If not provided, pocket-vue will search for and mount to all elements with the `v-scope` directive. If no `v-scope` is found, it will mount to the entire `document.documentElement` (not recommended for performance).

### `app.unmount()`

Unmounts the application and cleans up reactive effects and directive cleanup callbacks. Native DOM event listeners registered by `v-on` are attached to their elements and are not explicitly removed unless the element is removed or a custom directive returns its own cleanup callback.

### `app.directive(name: string, def?: Directive)`

Registers a global custom directive.

- **`name`**: The name of the directive (without the `v-` prefix).
- **`def`**: The directive definition function.

### `app.use(plugin: any, options?: any)`

Installs a plugin.

- **`plugin`**: A plugin object with an `install()` method.
- **`options`**: Optional configuration for the plugin.

---

## Instance Properties

### `app.scope`

The reactive root scope object of the application.

### `app.rootBlocks`

An array of internal `Block` instances representing the mounted application roots.

---

## Global Configuration

### Custom Delimiters

You can change the default mustache delimiters (`{{ }}`) by providing a `$delimiters` property in your initial data.

```javascript
createApp({
  $delimiters: ['[[', ']]'],
  message: 'Hello'
}).mount()
```

Template usage:
```html
<div>[[ message ]]</div>
```
