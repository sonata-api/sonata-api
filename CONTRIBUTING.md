# Contribution Guide

## Style guidelines

Here's some text editor configuration you want to setup before contributing:

- Set 2 spaces as indent (your text editor should just map tab to spaces)
- Plugins for typehints and autocompletion

General guidelines:

- No makeshifts. If a feature is hard to implement then you should ask for help.
- Variables are named in English and their descriptiveness vary according to the scope.
- The `async`/`await` syntax is ALWAYS prefered over `then`/`catch`.
- Avoid deep scope nesting (if/else cases nested too deeply).
- If a code block is too complex or hard to understand then document it inline using JSDoc comments.
- Use `try`/`catch` ONLY where necessary. Too broad `try`/`catch` scopes are misguiding.


### No explicit any

There are rare situations when `any` type is really suitable. If your callback requires a `any` type in order to work, then your source object is probably not typed correctly. If you are declaring a unstructured object, you should give it `object` or `Record<string, any>` type instead of `any`.

Write this:

```typescript
const unstructuredData: Record<string, any> = {}

const myList: Array<Person> = []

// ...

myList.forEach((person) => {
  console.log(person.personalData.name)
})
```

Instead of:

```typescript
const unstructuredData: any = {}

const myList = []

// ...

myList.forEach((person: Person) => {
  console.log(person.personalData.name)
})
```


### No collateral effects

In the second and third examples the `transform` function will produce an undesired collateral effect on the source object. This is bad because sometimes we want to apply some kind of transformation to an object while still preserving the original intact.

Write this:

```typescript
const transform = (source: T) => {
  const target = Object.assign({}, source)
  target.someProp = true
  return target
}
```

Instead of:

```typescript
const transform = (source: T) => {
  source.someProp = true
}
```

Or even:

```typescript
// this is also wrong because source is still being mutated
const transform = (source: T) => {
  source.someProp = true
  return souce
}
```

Also don't add properties on `globalThis`, use another approach like dynamically importing.


### No uneeded type annotations

In the first example the `name` and `someFn` variables are inferred as `'"Sonata API"'` and `'() => "some inferrable type"'` respectively. In the second example they're annotated with the much less useful types `'string'` and `'() => string'`. As a rule, if TypeScript can infer it, don't annotate.

Write this:

```typescript
const name = 'Sonata API'

const someFn = () => {
  return 'some inferrable type'
}
```

Instead of:

```typescript
const name: string = 'Sonata API'

const someFn = (): string => {
  return 'some inferrable type'
}
```


### Use conventions for TypeScript names

It's much harder to determine what the `T` type is in the second example. It is better to have descriptive generic parameter names whenever possible.

Write this:

```typescript
const someFn = <TPerson extends Person>(person: TPerson) => person
```

Instead of:

```typescript
const someFn = <T extends Person>(person: T) => person
```


### No classes

Give preference to the object notation. If your object doesn't reference `this` anywhere and you are just using classes to fit functions together then you should probably just export these functions separately.

Write this:

```typescript
const makePerson = (name: string): Person => ({
  name,
  hello() {
    console.log(this.name)
  }
})
```

Or preferrably this:

```typescript
export const hello = (person: Person) => {
    console.log(person.name)
}
```

Instead of:

```typescript
class Person {
  constructor(private name: str) {
  }

  hello() {
    console.log(this.name)
  }
}
```

### Don't use computed properties without necessity

You may still use them, but only when is there some actual computation going on.
Those are generally rare.

Write this:

```typescript
const pet = {
  name: 'Thor',
  specie: 'dog'
}

pet.name = 'Bobby'
```

Instead of:

```typescript
// computed properties have completely no use in this example
// it is just making the code more verbose

const pet = {
  _name: 'Thor',
  get name() {
    return this._name
  },
  set name() {
    return this._name
  }
}

pet.name = 'Bobby'
```


### Don't throw anything except software exceptions

Use [https://antman-does-software.com/stop-catching-errors-in-typescript-use-the-either-type-to-make-your-code-predictable](`Either`) instead. Exceptions are to be thrown only if they derive from a software-level error.

Write this:

```typescript
import { left } from '@sonata-api/common'

export enum MyErrors {
  CheckFailed = 'CHECK_FAILED'
}

const someFn = () => {
  if( !performSomeCheck() ) {
    return left(MyErrors.CheckFailed)
  }

  return right('ok')
}
```

Instead of:

```typescript
const someFn = () => {
  if( !performSomeCheck() ) {
    throw new Error('oh no! found some business logic error!')
  }

  return 'ok'
}
```
