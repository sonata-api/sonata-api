# Aeria ![https://github.com/sonata-api/sonata-api/actions/workflows/ci.yaml](https://github.com/sonata-api/sonata-api/actions/workflows/ci.yaml/badge.svg)

<img
  align="left"
  src="/assets/aeria-logo.png"
  alt="Aeria Logo" 
  width="200px"
  height="200px"
/>


An intuitive web framework tuned for security and efficiency.

```typescript
router.POST('/get-pets', (context) => {
  return context.collections.pet.functions.getAll({
    filters: context.request.payload
  })
})
```

<br clear="left" />

## Features

### Minimalistically typed

A type-driven experience is provided with state-of-the-art TypeScript, no code generation required. Define your collection structure with a runtime Javascript object then it's type will be made universally available, even to the frontend.

### A more cohesive fullstack

Aeria makes your backend metadata fully available to the frontend with [JSON Schema](https://json-schema.org/), allowing third parties to quickly grasp how your data should be rendered. It also has an official counterpart library called [Aeria UI]() that automatically picks the best visual representation for your data into a Vue frontend.

### Better error handling

Inspired by functional languages, Aeria makes use of the much safer and runtime efficient `Either` approach to error handling. Route callbacks have their exceptions handled by default, so your application won't crash if you miss a try/catch block.


## Resources

- [Official Documentation](https://aeria.land/)
