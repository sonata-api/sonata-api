# Aeria

An intuitive web framework tuned for security and efficiency.

```typescript
router.GET('/get-pets', (context) => {
  const filters = validateSilently(context.request.query, {
    required: [],
    properties: {
      name: {
        type: 'string'
      }
    }
  })

  return context.collections.pet.functions.getAll({
    filters
  })
})
```

### Minimalistically typed

A type-driven experience is provided with state-of-the-art TypeScript, no code generation required. Define your collection structure with a runtime Javascript object then it's type will be made universally available, even to the frontend.

### A more cohesive fullstack

Aeria makes your backend metadata fully available to the frontend and extends [JSON Schema](https://json-schema.org/) with visual representation attributes, allowing third parties to quickly grasp how your data should be rendered in the frontend.

### Better error handling

Inspired by functional languages, Aeria makes use of the much safer and runtime efficient `Either` approach to error handling. Route callbacks have their exceptions handled by default, so your application won't crash if you miss a try/catch block.

