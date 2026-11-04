# Scope and Context

pocket-vue uses a hierarchical scope system similar to JavaScript's lexical scoping. This allows components to inherit and share data efficiently.

## Scope Inheritance

When you nest `v-scope` directives, a new child scope is created that inherits from the parent scope via JavaScript's prototype chain. This means child scopes can read parent properties, but writing to a property will check the current scope first.

<div v-pre>

```html
<div v-scope="{ outer: 'hello' }">
  <p>Outer: {{ outer }}</p>

  <div v-scope="{ inner: 'world' }">
    <!-- Child scope can access parent properties -->
    <p>Inner: {{ outer }} {{ inner }}</p>
  </div>
</div>
```

</div>

### Property Overriding

If a child scope defines a property with the same name as a parent property, it will "shadow" the parent property.

<div v-pre>

```html
<div v-scope="{ name: 'Parent' }">
  <div v-scope="{ name: 'Child' }">
    <p>{{ name }}</p> <!-- Displays 'Child' -->
  </div>
</div>
```

</div>

### Updating Parent State

When you assign a value to a property in a template, pocket-vue will first check if the property exists on the current scope. If it doesn't, it will walk up the scope chain (prototype chain) and update the property on the first parent scope where it finds it.

<div v-pre>

```html
<div v-scope="{ count: 0 }">
  <p>{{ count }}</p>
  <div v-scope="{ localMsg: 'hi' }">
    <!-- Modifies parent's count since 'count' is not on this scope -->
    <button @click="count++">Increment Parent Count</button>
    <p>{{ localMsg }} - {{ count }}</p>
  </div>
</div>
```

</div>

---

## Implicit Data Sharing (Scope Inheritance)

Since pocket-vue uses prototype-based scope inheritance, any property defined in a parent scope is automatically accessible in all descendant scopes — no special API is needed.

```html
<div v-scope="{ theme: 'dark' }">
  <p>Theme: {{ theme }}</p>

  <div v-scope="{ title: 'Hello' }">
    <!-- Both 'theme' and 'title' are accessible here -->
    <p>{{ title }} ({{ theme }})</p>
  </div>
</div>
```

For sharing state across multiple independent apps or distant components, see the [Global State](../advanced/global-state.md) guide using the `reactive()` function.

---

## Accessing Component Instance

### `$root`

The root element of the current component (the element with `v-scope`). This is set automatically when `v-scope` initializes.

```html
<div v-scope>
  <button @click="console.log($root)">
    Log Component Root
  </button>
</div>
```

### `$refs`

A collection of elements marked with the `ref` attribute. See [$refs](../globals/refs.md) for details.

### `$nextTick`

A function to defer a callback until after the next DOM update cycle. See [$nextTick](../globals/nextTick.md) for details.
