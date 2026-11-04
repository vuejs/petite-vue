# $el

Represents the current element that the directive is bound to.

## Usage

`$el` is available in all directive expressions, including event handlers (`@click`), `v-bind`, `v-effect`, and more.

### In Event Handlers

```html
<button @click="console.log($el)">Log Me</button>
```

### In v-effect

```html
<div v-scope="{ msg: 'hello' }">
  <div v-effect="$el.textContent = msg"></div>
</div>
```

### Auto-focus Input

```html
<input @vue:mounted="$el.focus()">
```

### Integrating 3rd Party Libraries

```html
<div @vue:mounted="new Pikaday({ field: $el })">
  <input type="text">
</div>
```

## Difference from standard Vue

In standard Vue, `$el` typically refers to the component's root element. In pocket-vue, `$el` always points to the current element the directive is on.
