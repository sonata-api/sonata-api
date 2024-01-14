# Aeria

<p>
  <a href="https://github.com/sonata-api/sonata-api/actions/workflows/ci.yaml/badge.svg">
    <img src="https://github.com/kazupon/vue-i18n/actions/workflows/ci.yml/badge.svg" alt="Continuos Integration" />
  </a>

  <img
    src="/assets/aeria-logo.png"
    alt="Aeria Logo" 
    width="128px"
    height="128px"
  />

  An intuitive web framework tuned for security and efficiency.
</p>


```typescript
router.POST('/get-pets', (context) => {
  return context.collections.pet.functions.getAll({
    filters: context.request.payload
  })

}, {
  payload: {
    type: 'object',
    properties: {
      name: {
        type: 'string'
      }
    }
  }
})
```

### Minimalistically typed

A type-driven experience is provided with state-of-the-art TypeScript, no code generation required. Define your collection structure with a runtime Javascript object then it's type will be made universally available, even to the frontend.

### A more cohesive fullstack

Aeria makes your backend metadata fully available to the frontend and extends [JSON Schema](https://json-schema.org/) with visual representation attributes, allowing third parties to quickly grasp how your data should be rendered. It also has an official counterpart library called [Aeria UI]() that implements all those attributes.

### Better error handling

Inspired by functional languages, Aeria makes use of the much safer and runtime efficient `Either` approach to error handling. Route callbacks have their exceptions handled by default, so your application won't crash if you miss a try/catch block.

