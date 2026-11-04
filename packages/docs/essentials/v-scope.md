# v-scope

`v-scope` is the primary directive in pocket-vue. It marks a region of the DOM that should be controlled by pocket-vue.

## Usage

### Inline Scope

You can pass a JavaScript object directly to `v-scope` to define the initial state:

```html
<div v-scope="{ count: 0 }">
  {{ count }}
</div>
```

> [!TIP]
> The expression inside `v-scope` is evaluated once when the component is initialized. It should return an object.

### Server-Side Data Injection

One of the most powerful features of `v-scope` is initializing it with data from your backend.

```html
<!-- In your server template (e.g., Blade, EJS, Jinja2) -->
<div v-scope="{ 
  user: { id: 1, name: 'Rush' }, 
  settings: {{ json_encode($settings) }} 
}">
  <p>Welcome, {{ user.name }}</p>
</div>
```

This allows you to pass initial state directly from your database without making an extra API call.

### Explicit Mount Target

If you don't use the `init` attribute on the script tag, you can manually mount pocket-vue to specific elements. In this case, `v-scope` serves as a marker.

```html
<div id="app" v-scope>
  {{ count }}
</div>

<script>
  PocketVue.createApp({ count: 0 }).mount('#app')
</script>
```

### Multiple Apps

You can have multiple independent pocket-vue apps on the same page:

```html
<div v-scope="{ count: 1 }">
  App 1: {{ count }}
</div>

<div v-scope="{ count: 2 }">
  App 2: {{ count }}
</div>
```

## Scope Inheritance

Nested `v-scope` regions create nested scopes. Child scopes can access properties from parent scopes, but writing to a property will check the current scope first.

```html
<div v-scope="{ outer: 'outer' }">
  <p>{{ outer }}</p>
  
  <div v-scope="{ inner: 'inner' }">
    <p>{{ outer }} - {{ inner }}</p>
  </div>
</div>
```

## Best Practices

### Function Factories

For anything more complex than a simple counter, it is recommended to use a function to return the initial state. This keeps your template clean and allows for reusable logic.

```html
<script>
  function Counter(initial = 0) {
    return {
      count: initial,
      inc() { this.count++ },
      dec() { this.count-- }
    }
  }
</script>

<div v-scope="Counter(10)">
  <button @click="dec">-</button>
  <span>{{ count }}</span>
  <button @click="inc">+</button>
</div>
```

### Avoid Global Pollution

If you are not using ES modules, be careful not to pollute the global namespace. You can namespace your components:

```html
<script>
  const App = {
    Counter() { ... },
    Todo() { ... }
  }
</script>

<div v-scope="App.Counter()">...</div>
```

