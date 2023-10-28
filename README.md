# Aeria

### End-to-end strong typing

A type-driven experience is provided with state-of-the-art TypeScript with no code generation required. Just define your collection structure with a runtime Javascript object then it's type will be made universally available, even to the frontend. Aeria public APIs are also minimalistically typed, so most bugs should be caught during the build time.

### A more cohesive fullstack

Your data will be visually represented at some point. Aeria makes your backend metadata fully available to the frontend and extends [JSON Schema](https://json-schema.org/) with visual representation attributes, so frontend engineers can build faster and smarter.

### Better error handling

Instead of cascading try-catches and producing unecessary runtime overhead, Aeria makes use of the much safer `Either` approach to error handling, inspired by the functional languages and Rust's `Result<T, E>`. Apart from that, a top level try-catch block already does smart exception handling, so theres no risk a route callback will crash your application -- ever. Break free from exception hell.

