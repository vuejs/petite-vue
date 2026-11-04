# Vue Compatibility

pocket-vue uses Vue-style template syntax and Vue's reactivity package, but it is not the full Vue runtime. Use this page to check which Vue features are supported, partially supported, or intentionally omitted.

## Supported

| Feature | Notes |
| --- | --- |
| Interpolation | Text interpolation with `{{ }}` or custom delimiters. |
| `v-scope` | Creates a reactive scope for an element. |
| `v-if`, `v-else-if`, `v-else` | Conditional rendering. |
| `v-for` | Arrays, objects, numbers, and basic destructuring. |
| `v-model` | Text inputs, textareas, checkboxes, radios, and selects. |
| `v-bind` / `:` | Attribute, class, style, object, and `:ref` bindings. |
| `v-on` / `@` | DOM event listeners, common modifiers, key modifiers, and `@vue:mounted` / `@vue:unmounted`. |
| `v-show` | Toggles inline `display`. |
| `v-text`, `v-html`, `v-cloak`, `v-pre`, `v-once` | Supported as lightweight directives. |
| `ref` | Stores DOM elements on `$refs`. |
| `reactive()` | Re-exported from `@vue/reactivity`. |
| `watchEffect()` | Alias for `effect` from `@vue/reactivity`; returns the effect runner. |

## Different from full Vue

| Area | pocket-vue behavior |
| --- | --- |
| Components | Components are plain functions or objects returned from `v-scope`; there are no SFCs, render functions, props validation, emits, slots, or `setup()`. |
| Refs | `ref` stores DOM elements, including elements that also have `v-scope`. It does not return a Vue component instance. |
| Reactivity exports | Only `reactive()` and `watchEffect()` are exported from `pocket-vue`. Import `ref()`, `computed()`, and other APIs from `@vue/reactivity` if needed. |
| Event listeners | `@event` listeners are attached to DOM elements. `app.unmount()` stops reactive effects and directive cleanup callbacks, but native event listeners remain attached until the DOM elements are removed or the browser releases them. |
| Expressions | Template expressions are evaluated at runtime with `new Function()` and are rejected if they match pocket-vue's unsafe-expression checks. |
| Mounting | `app.mount(selector)` returns `undefined` if the selector does not match an element. |
| CSP | Strict Content Security Policies that block `new Function()` are not supported. |

## Unsupported Vue syntax

| Vue feature | What to use instead |
| --- | --- |
| Single-file components (`.vue`) | Plain HTML plus `v-scope` objects/functions. |
| `createApp(Component)` root components | `createApp(initialData).mount(target)`. |
| `setup()`, `data()`, `methods`, `computed` options | Return or pass a plain object with fields, methods, and JavaScript getters. |
| `props`, `emits`, `provide` / `inject` | Pass values through functions, parent scopes, or shared reactive stores. |
| Slots and scoped slots | Use normal HTML/template fragments and `v-scope` functions. |
| Transitions | Use CSS and lifecycle events manually. |
| `v-on="object"` | Use individual event bindings like `@click="onClick"`. |
| Full Vue app config/plugins | pocket-vue plugins only receive the pocket-vue app instance and can register directives or mutate app state. |

## When to choose full Vue instead

Use full Vue if you need SFCs, router-driven SPA behavior, rich component contracts, SSR hydration, strict CSP without `unsafe-eval`, or the full Composition API from the `vue` package.
