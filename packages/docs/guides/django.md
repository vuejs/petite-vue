# Django Integration Guide

pocket-vue is an excellent companion for Django applications. It allows you to add interactivity to your templates while keeping your backend logic in Python.

## Installation

The easiest way to use pocket-vue in Django is by adding a `<script>` tag to your base template.

```html
<!-- base.html -->
<head>
  <script src="https://unpkg.com/pocket-vue" defer init></script>
</head>
```

---

## Data Injection

You can pass data from your Django views directly into `v-scope` by serializing it as JSON.

### In your Django View:

```python
import json
from django.shortcuts import render

def profile_view(request):
    user_data = {
        'username': request.user.username,
        'email': request.user.email,
        'is_premium': True
    }
    return render(request, 'profile.html', {
        'user_json': json.dumps(user_data)
    })
```

### In your Django Template:

Use the `safe` filter to prevent Django from escaping the JSON string.

```html
<div v-scope="{{ user_json|safe }}">
  <p>Username: {{ username }}</p>
  <p v-if="is_premium">Premium User Badge</p>
</div>
```

---

## CSRF Token Handling

Django requires a CSRF token for any POST, PUT, or DELETE requests.

### Option 1: Reading from Meta Tag
Add the token to a meta tag in your `base.html`:

```html
<meta name="csrf-token" content="{{ csrf_token }}">
```

Then access it in your pocket-vue methods:

```javascript
function submitForm() {
  const token = document.querySelector('meta[name="csrf-token"]').content
  fetch('/api/save/', {
    method: 'POST',
    headers: {
      'X-CSRFToken': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(this.formData)
  })
}
```

---

## Practical Examples

### 1. Progressive Form Validation
Enhance your existing Django forms with real-time validation.

```html
<form method="POST" v-scope="{ 
  username: '',
  get isValid() { return this.username.length >= 3 }
}">
  {% csrf_token %}
  <input type="text" name="username" v-model="username">
  <p v-show="username && !isValid" style="color: red;">
    Username must be at least 3 characters.
  </p>
  <button :disabled="!isValid">Submit</button>
</form>
```

### 2. Dynamic Dependent Dropdowns
Update a second dropdown based on the selection of the first.

```html
<div v-scope="{ 
  selectedCategory: '',
  categories: {
    'fruits': ['Apple', 'Banana'],
    'veggies': ['Carrot', 'Potato']
  },
  get currentItems() {
    return this.categories[this.selectedCategory] || []
  }
}">
  <select v-model="selectedCategory">
    <option value="">Select Category</option>
    <option value="fruits">Fruits</option>
    <option value="veggies">Vegetables</option>
  </select>

  <select :disabled="!selectedCategory">
    <option v-for="item in currentItems">{{ item }}</option>
  </select>
</div>
```

---

## Handling Template Conflicts

Since both Django and pocket-vue use `{{ }}` for interpolation, you have two options:

### 1. Escape the braces
Wrap the pocket-vue content in `{% verbatim %}` tags.

```html
{% verbatim %}
  <div>{{ pico_vue_variable }}</div>
{% endverbatim %}
```

### 2. Change pocket-vue delimiters
Configure pocket-vue to use different delimiters.

```javascript
createApp({
  $delimiters: ['[[', ']]']
}).mount()
```

Template:
```html
<div>[[ pico_vue_variable ]]</div>
```
