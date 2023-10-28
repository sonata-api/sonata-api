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

### End-to-end strong typing

A type-driven experience is provided with state-of-the-art TypeScript with no code generation required. Just define your collection structure with a runtime Javascript object then it's type will be made universally available, even to the frontend. Aeria public APIs are also minimalistically typed, so most bugs should be caught during the build time.

### A more cohesive fullstack

Aeria makes your backend metadata fully available to the frontend and extends [JSON Schema](https://json-schema.org/) with visual representation attributes, enabling frontend engineers to build faster and smarter with whathever libraries comes in mind.

### Better error handling

Instead of using try-catches everywhere, Aeria makes use of the much safer and runtime efficient `Either` approach to error handling, inspired by functional languages. Unlike traditional web frameworks like Express, routes in Aeria have their exceptions handled by default, so you may use try-catches only where you intend to handle exceptions manually.

