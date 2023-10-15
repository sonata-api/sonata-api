# Sonata API
> “An idiot admires complexity, a genius admires simplicity, a physicist tries to make it simple, for an idiot anything the more complicated it is the more he will admire it, if you make something so clusterf****d he can't understand it he's gonna think you're a god cause you made it so complicated nobody can understand it. That's how they write journals in Academics, they try to make it so complicated people think you're a genius” — Terry A. Davis

## Introduction

Sonata API is a **REST framework** that focuses on developer experience and simplicity.

## Features

- Out of the box authentication, file management, logging, rate limiting & more
- Minimal code surface, meaning more productivity and an also minimal attack surface
- Every use case can be trivially accessed for scripting and unit testing
- Output your entire API as a single auto-executable JS file
- Tiny dependency graph


## The 15-seconds example

The code below implements a fully-fledged RESTful API within a single JavaScript file. It will do just what you think it does.
If the code surface is minimal, readability is inevitably easy.

```javascript
const { init, useFunctions } = require('sonata-api/untyped')

exports.collections = {
  animal: () => ({
    description: {
      $id: 'string',
      properties: {
        name: {
          type: 'string'
        },
        specie: {
          enum: [
            'dog',
            'cat',
            'bird'
          ]
        }
      }
    },
    functions: useFunctions([
      'insert',
      'getAll'
    ])
  })
}

init()
```

## Leveling up

- Read the [official documentation](https://sonata-api.github.io/docs/guide/getting-started)
- Take a look at some neat [examples](https://github.com/sonata-api/sonata-examples)
- Join our [Discord community]()
- Ready to participate? Read the [Contributing Guide](https://github.com/ringeringeraja/sonata-api/tree/master/CONTRIBUTING.md)

## License

Sonata API is [MIT licensed](https://github.com/ringeringeraja/sonata-api/tree/master/LICENSE).
