# v-bind

`v-bind` is used to dynamically bind one or more attributes to an expression. It's one of the most fundamental directives in pocket-vue.

## Shorthand

The `:` character is a shorthand for `v-bind`.

```html
<!-- full syntax -->
<a v-bind:href="url">Link</a>

<!-- shorthand (preferred) -->
<a :href="url">Link</a>
```

---

## Attribute Binding

You can bind any HTML attribute to a reactive value. For generic attributes, `null` and `undefined` remove the attribute; other values, including `false`, are written as attribute values.

```html
<div v-scope="{ title: 'Hello World', isDisabled: true }">
  <div :title="title">Hover over me</div>
  <button :disabled="isDisabled">Cannot Click Me</button>
</div>
```

### Boolean Attributes
For DOM boolean properties like `disabled`, `checked`, `required`, etc., pocket-vue sets the corresponding property, so truthy values enable the property and falsy values disable it.

---

## Class Binding

### Object Syntax
Pass an object to `:class` to dynamically toggle classes. The key is the class name, and the value is a boolean that determines if the class should be applied.

```html
<div :class="{ active: isActive, 'text-danger': hasError }"></div>
```

### Array Syntax
Pass an array of class names. You can also nest objects inside the array.

```html
<div :class="[activeClass, { 'is-loading': isLoading }]"></div>
```

---

## Style Binding

### Object Syntax
Pass an object to `:style`. You can use either camelCase (recommended) or kebab-case for the CSS property names.

```html
<div :style="{ color: activeColor, fontSize: fontSize + 'px' }"></div>
```

### Array Syntax
Pass an array of style objects to apply multiple sets of styles.

```html
<div :style="[baseStyles, themeStyles]"></div>
```

### CSS Custom Properties
You can also bind to CSS variables.

```html
<div :style="{ '--main-color': color }"></div>
```

---

## Modifiers

### `.camel`
The `.camel` modifier converts the attribute name to camelCase. This is primarily useful for SVG attributes like `viewBox`.

```html
<!-- Renders as viewBox="0 0 100 100" -->
<svg :view-box.camel="viewBox"></svg>
```

---

## Dynamic Binding of Multiple Attributes

You can bind an entire object of attributes by using `v-bind` without an argument.

```html
<div v-scope="{ attrObj: { id: 'container', class: 'wrapper' } }">
  <div v-bind="attrObj"></div>
</div>
```

