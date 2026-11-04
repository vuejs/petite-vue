# Directive Reference

This page provides a quick reference for all built-in directives available in pocket-vue.

| Directive | Syntax | Description |
|-----------|--------|-------------|
| [**v-scope**](../essentials/v-scope.md) | `v-scope="{ count: 0 }"` | Marks an element as a component and defines its scope. |
| [**v-if**](../directives/v-if.md) | `v-if="ok"`, `v-else-if`, `v-else` | Conditionally render elements. |
| [**v-show**](../directives/v-show.md) | `v-show="ok"` | Toggles visibility using CSS `display`. |
| [**v-for**](../directives/v-for.md) | `v-for="item in items"` | Iterate over arrays or objects. |
| [**v-model**](../directives/v-model.md) | `v-model="msg"` | Two-way data binding on form inputs. |
| [**v-on**](../directives/v-on.md) | `@click="doThis"`, `v-on:submit.prevent` | Attach event listeners. |
| [**v-bind**](../directives/v-bind.md) | `:src="imageSrc"`, `v-bind:class` | Reactive attribute binding. |
| [**v-effect**](../directives/v-effect.md) | `v-effect="console.log(count)"` | Run reactive side effects. |
| [**v-text**](../directives/v-text.md) | `v-text="msg"` | Update element text content. |
| [**v-html**](../directives/v-html.md) | `v-html="rawHtml"` | Update element `innerHTML`. |
| [**v-cloak**](../directives/v-cloak.md) | `v-cloak` | Hides uncompiled templates until ready. |
| [**v-pre**](../directives/v-pre.md) | `v-pre` | Skip compilation for this element. |
| [**v-once**](../directives/v-once.md) | `v-once` | Render once and skip future updates. |
| [**ref**](../directives/ref.md) | `ref="myDiv"` | Register a reference to an element. |

---

## Directives Summary

### [v-scope](../essentials/v-scope.md)
Initializes reactive state for a DOM element and its children.

### [v-if](../directives/v-if.md)
Toggle elements based on conditions. Elements are created/destroyed.

### [v-for](../directives/v-for.md)
Repeat elements based on source data (arrays, objects, or ranges).

### [v-model](../directives/v-model.md)
Create two-way data bindings for form inputs like text, checkbox, radio, and select.

### [v-on (@)](../directives/v-on.md)
Handle browser events with optional modifiers like `.prevent`, `.stop`, and keyboard keys.

### [v-bind (: )](../directives/v-bind.md)
Dynamically update HTML attributes, classes, and styles.

### [v-show](../directives/v-show.md)
Toggle visibility using the `display` CSS property without removing the element from the DOM.

### [v-effect](../directives/v-effect.md)
Perform complex side effects or integrate with 3rd-party libraries reactively.
