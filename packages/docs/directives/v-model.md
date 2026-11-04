# v-model

`v-model` is used to create a two-way data binding on form input elements. It automatically picks the right way to update the element based on the input type.

## Basic Usage: Text Inputs

For `<input type="text">`, `<textarea>`, and `<input type="email">`, `v-model` binds to the `value` property and listens for the `input` event.

```html
<div v-scope="{ message: '' }">
  <input v-model="message" placeholder="Type something...">
  <p>Message is: {{ message }}</p>
  
  <textarea v-model="message" placeholder="Type more..."></textarea>
</div>
```

---

## Checkboxes

### Single Checkbox
Binds to the `checked` property and uses a boolean value.

```html
<div v-scope="{ checked: true }">
  <input type="checkbox" id="checkbox" v-model="checked">
  <label for="checkbox">Checked: {{ checked }}</label>
</div>
```

### Multiple Checkboxes
Binds to the same array. Items are added/removed from the array based on the `value` attribute of the checkbox.

```html
<div v-scope="{ selectedItems: [] }">
  <input type="checkbox" value="Apple" v-model="selectedItems">
  <input type="checkbox" value="Banana" v-model="selectedItems">
  <input type="checkbox" value="Cherry" v-model="selectedItems">
  
  <p>Selected: {{ selectedItems }}</p>
</div>
```

---

## Radio Buttons

Binds to the same property. The value will be set to the `value` attribute of the selected radio button.

```html
<div v-scope="{ picked: '' }">
  <input type="radio" value="One" v-model="picked">
  <input type="radio" value="Two" v-model="picked">
  
  <p>Picked: {{ picked }}</p>
</div>
```

---

## Select Menus

### Single Select
Binds to the selected option's value.

```html
<div v-scope="{ selected: '' }">
  <select v-model="selected">
    <option disabled value="">Select one</option>
    <option>A</option>
    <option>B</option>
  </select>
  <p>Selected: {{ selected }}</p>
</div>
```

### Multiple Select
Binds to an array of selected option values.

```html
<div v-scope="{ selected: [] }">
  <select v-model="selected" multiple>
    <option>A</option>
    <option>B</option>
    <option>C</option>
  </select>
  <p>Selected: {{ selected }}</p>
</div>
```

---

## Modifiers

### `.lazy`
By default, `v-model` syncs the input on every `input` event. Use `.lazy` to sync after `change` events instead.

```html
<input v-model.lazy="msg">
```

### `.number`
Automatically cast the input value to a number. This is especially useful for `type="number"` or `type="range"`.

```html
<input v-model.number="age" type="number">
```

### `.trim`
Automatically trim any whitespace from the beginning and end of the input value.

```html
<input v-model.trim="msg">
```

---

## Dynamic Binding and Custom Values

You can bind the value of checkboxes or radio buttons to dynamic values using `v-bind`.

```html
<div v-scope="{ picked: '', first: 'A', second: 'B' }">
  <input type="radio" v-model="picked" :value="first">
  <input type="radio" v-model="picked" :value="second">
</div>
```

### True/False Value for Checkboxes
For checkboxes, you can customize the values used for checked and unchecked states using `:true-value` and `:false-value` bindings.

```html
<input type="checkbox" v-model="toggle" :true-value="'yes'" :false-value="'no'">
```

> [!NOTE]
> You must use the `:true-value` and `:false-value` binding syntax (with the `:` prefix), not plain HTML attributes.

