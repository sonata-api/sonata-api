# `@sonata-api/security`

## Introduction

This package implements common security checks.
The checks can be used separatelly, or through a function called `useSecurity()`. This function returns an object with two functions:

- `beforeRead()`: checks to be made before reading data
- `beforeWrite()`: checks to be made before writing data

## References

- [CWE-284: Improper Access Control](https://cwe.mitre.org/data/definitions/284.html)
- [CWE-471: Modification of Assumed-Immutable Data (MAID)](https://cwe.mitre.org/data/definitions/471.html )
- [CWE-639: Authorization Bypass Through User-Controlled Key](https://cwe.mitre.org/data/definitions/639.html)
- [CWE-770: Allocation of Resources Without Limits or Throttling](https://cwe.mitre.org/data/definitions/770.html)

