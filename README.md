# Aeria ![https://github.com/sonata-api/sonata-api/actions/workflows/ci.yaml](https://github.com/sonata-api/sonata-api/actions/workflows/ci.yaml/badge.svg)

<img
  align="left"
  src="/assets/aeria-logo.png"
  alt="Aeria Logo" 
  width="190px"
  height="190px"
/>


An intuitive web framework tuned for security and efficiency.

```typescript
router.POST('/get-pets/(\w+)', (context) => {
  return context.collections.pet.functions.getAll({
    filters: {
      name: context.request.fragments[0]
    }
  })
})
```

<br clear="left" />

## Features

### Minimalistically typed

A type-driven experience is provided with state-of-the-art TypeScript, no code generation required. Define your collection structure with a runtime JavaScript object then it's type will be made universally available, even to the frontend.

### A more cohesive fullstack

Aeria makes your backend metadata fully available to the frontend with [JSON Schema](https://json-schema.org/), allowing third parties to quickly grasp how your data should be rendered. The official counterpart library [Aeria UI]() makes possible to bring up a complete frontend for an Aeria backend within minutes.

### Better error handling

Inspired by functional languages, Aeria makes use of the much safer and runtime efficient `Either` approach to error handling. Route callbacks have their exceptions handled by default, so your application won't crash if you miss a try/catch block.

### Runtime safety

All input data is optionally validated using the same schemas used during collection definition. Access Control is also shipped to allow even those who are unfamiliar with AppSec to build safely without stumbling into common security weaknesses.


## Resources

- [Official Documentation](https://aeria.land/aeria/)
- [Aeria Lang](https://aeria.land/)

