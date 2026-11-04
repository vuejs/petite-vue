# Form Handling

Forms are a crucial part of any application. pocket-vue makes handling form inputs and submission straightforward with `v-model`.

## Basic Bindings

### Text Input

```html
<div v-scope="{ message: '' }">
  <input v-model="message" placeholder="edit me">
  <p>Message is: {{ message }}</p>
</div>
```

### Checkbox

```html
<div v-scope="{ checked: true }">
  <input type="checkbox" id="checkbox" v-model="checked">
  <label for="checkbox">{{ checked }}</label>
</div>
```

### Radio

```html
<div v-scope="{ picked: 'One' }">
  <input type="radio" id="one" value="One" v-model="picked">
  <label for="one">One</label>
  
  <input type="radio" id="two" value="Two" v-model="picked">
  <label for="two">Two</label>
  
  <p>Picked: {{ picked }}</p>
</div>
```

### Select

```html
<div v-scope="{ selected: 'A' }">
  <select v-model="selected">
    <option disabled value="">Please select one</option>
    <option>A</option>
    <option>B</option>
    <option>C</option>
  </select>
  
  <p>Selected: {{ selected }}</p>
</div>
```

## Form Submission

You can use `v-on:submit.prevent` (or `@submit.prevent`) to handle form submission via JavaScript.

```html
<script>
  function LoginForm() {
    return {
      email: '',
      password: '',
      isLoading: false,
      error: null,
      
      async submit() {
        this.isLoading = true
        this.error = null
        
        try {
          const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: this.email, 
              password: this.password 
            })
          })
          
          if (!res.ok) throw new Error('Login failed')
          
          window.location.href = '/dashboard'
        } catch (e) {
          this.error = e.message
        } finally {
          this.isLoading = false
        }
      }
    }
  }
</script>

<form v-scope="LoginForm()" @submit.prevent="submit">
  <div v-if="error" class="error">{{ error }}</div>
  
  <input type="email" v-model="email" required>
  <input type="password" v-model="password" required>
  
  <button :disabled="isLoading">
    {{ isLoading ? 'Logging in...' : 'Login' }}
  </button>
</form>
```

## Validation

While you can use native HTML5 validation attributes (like `required`, `type="email"`), you might want custom validation logic.

```html
<div v-scope="{ 
  username: '',
  get isValid() {
    return this.username.length >= 3
  },
  get errorMessage() {
    if (this.username.length === 0) return 'Username is required'
    if (this.username.length < 3) return 'Username must be at least 3 characters'
    return ''
  }
}">
  <input v-model="username">
  <span class="error">{{ errorMessage }}</span>
  
  <button :disabled="!isValid">Submit</button>
</div>
```
