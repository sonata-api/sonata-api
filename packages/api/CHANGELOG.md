# @sonata-api/api

## 0.0.75

### Patch Changes

- Fix count function when $text is present

## 0.0.74

### Patch Changes

- Fix getAll behavior with $text

## 0.0.73

### Patch Changes

- Make getter properties readOnly by default

## 0.0.72

### Patch Changes

- Improve traverseDocument autocasting

## 0.0.71

### Patch Changes

- Fix traverseDocument autocast failing with $elemMatch

## 0.0.70

### Patch Changes

- Fix removeFile

## 0.0.69

### Patch Changes

- Fix traverseDocument bug

## 0.0.68

### Patch Changes

- Fix memoization bug in preloadDescription

## 0.0.67

### Patch Changes

- Fix deep validation
- Updated dependencies
  - @sonata-api/validation@0.0.18
  - @sonata-api/system@0.0.41

## 0.0.66

### Patch Changes

- Fix recursive autocast

## 0.0.65

### Patch Changes

- Fix upload crashing because of invalid datetime
- Updated dependencies
  - @sonata-api/common@0.0.16

## 0.0.64

### Patch Changes

- Fix insert function and router bug when base === '/'
- Updated dependencies
  - @sonata-api/http@0.0.16

## 0.0.63

### Patch Changes

- Major fixes
- Updated dependencies
  - @sonata-api/validation@0.0.17
  - @sonata-api/common@0.0.15
  - @sonata-api/http@0.0.15

## 0.0.62

### Patch Changes

- Hot fix
- Updated dependencies
  - @sonata-api/validation@0.0.16

## 0.0.61

### Patch Changes

- Fixes
- Updated dependencies
  - @sonata-api/access-control@0.0.21
  - @sonata-api/system@0.0.40
  - @sonata-api/types@0.0.17

## 0.0.60

### Patch Changes

- Fix: enable mongodb operator support on \_id fields

## 0.0.59

### Patch Changes

- Fix routing bug where previously set payload was being ignored
- Updated dependencies
  - @sonata-api/http@0.0.13

## 0.0.58

### Patch Changes

- Implement more strict jsonschema typing
- Updated dependencies
  - @sonata-api/access-control@0.0.20
  - @sonata-api/common@0.0.14
  - @sonata-api/security@0.0.6
  - @sonata-api/system@0.0.39
  - @sonata-api/types@0.0.16
  - @sonata-api/validation@0.0.12

## 0.0.57

### Patch Changes

- Fix traverseDocument bug

## 0.0.56

### Patch Changes

- Several minor fixes
- Updated dependencies
  - @sonata-api/access-control@0.0.19
  - @sonata-api/validation@0.0.11
  - @sonata-api/mailing@0.0.9
  - @sonata-api/system@0.0.38

## 0.0.55

### Patch Changes

- Fix insert bug

## 0.0.54

### Patch Changes

- Fix upload bug

## 0.0.53

### Patch Changes

- Turn insert into Either

## 0.0.52

### Patch Changes

- Make insert loosely typed

## 0.0.51

### Patch Changes

- Fix preload bug
- Updated dependencies
  - @sonata-api/access-control@0.0.18
  - @sonata-api/types@0.0.15

## 0.0.50

### Patch Changes

- Fix bugs
- Updated dependencies
  - @sonata-api/access-control@0.0.17

## 0.0.49

### Patch Changes

- Patch bump
- Updated dependencies
  - @sonata-api/access-control@0.0.16
  - @sonata-api/http@0.0.10
  - @sonata-api/system@0.0.35
  - @sonata-api/validation@0.0.9

## 0.0.48

### Patch Changes

- Changes in routing and access control
- Updated dependencies
  - @sonata-api/access-control@0.0.15
  - @sonata-api/system@0.0.35
  - @sonata-api/http@0.0.9

## 0.0.47

### Patch Changes

- Fix getters, ergonomic routing
- Updated dependencies
  - @sonata-api/http@0.0.8

## 0.0.46

### Patch Changes

- Fix getAll bug introduced in last version

## 0.0.45

### Patch Changes

- Fix meta revalidation bug
- Updated dependencies
  - @sonata-api/system@0.0.33

## 0.0.44

### Patch Changes

- Add bypassAccessControl option to functions.get

## 0.0.43

### Patch Changes

- Bug fixes and optimizations
- Updated dependencies
  - @sonata-api/system@0.0.32

## 0.0.42

### Patch Changes

- Autocast datetime
- Updated dependencies
  - @sonata-api/validation@0.0.7
  - @sonata-api/types@0.0.14

## 0.0.41

### Patch Changes

- Optimize autopopulate
- Updated dependencies
  - @sonata-api/validation@0.0.6
  - @sonata-api/types@0.0.13

## 0.0.40

### Patch Changes

- Reduce network traffic
- Updated dependencies
  - @sonata-api/common@0.0.13

## 0.0.39

### Patch Changes

- Optimize autopopulate
- Updated dependencies
  - @sonata-api/types@0.0.12
  - @sonata-api/http@0.0.7

## 0.0.38

### Patch Changes

- Fix problem with $text queries

## 0.0.37

### Patch Changes

- Fix server post hook

## 0.0.36

### Patch Changes

- Remove residual console.log

## 0.0.35

### Patch Changes

- Fix autocast

## 0.0.34

### Patch Changes

- Deep autopopulate

## 0.0.33

### Patch Changes

- Fix $text queries

## 0.0.32

### Patch Changes

- Bug on count function

## 0.0.31

### Patch Changes

- Fix traverseDocument bug when subject is an array of MongoDB operators

## 0.0.30

### Patch Changes

- Improve deep document recursion
- Updated dependencies
  - @sonata-api/access-control@0.0.14
  - @sonata-api/system@0.0.28

## 0.0.29

### Patch Changes

- Version bump
- Updated dependencies
  - @sonata-api/access-control@0.0.13
  - @sonata-api/validation@0.0.5
  - @sonata-api/security@0.0.5
  - @sonata-api/mailing@0.0.7
  - @sonata-api/common@0.0.12
  - @sonata-api/system@0.0.25
  - @sonata-api/types@0.0.10
  - @sonata-api/http@0.0.6

## 0.0.28

### Patch Changes

- Update version
- Updated dependencies
  - @sonata-api/access-control@0.0.12
  - @sonata-api/common@0.0.11
  - @sonata-api/http@0.0.5
  - @sonata-api/mailing@0.0.6
  - @sonata-api/security@0.0.4
  - @sonata-api/system@0.0.24
  - @sonata-api/types@0.0.9
  - @sonata-api/validation@0.0.4

## 0.0.27

### Patch Changes

- Native MongoDB
- Updated dependencies
  - @sonata-api/access-control@0.0.11
  - @sonata-api/common@0.0.10
  - @sonata-api/mailing@0.0.5
  - @sonata-api/security@0.0.3
  - @sonata-api/system@0.0.23
  - @sonata-api/validation@0.0.3

## 0.0.26

### Patch Changes

- Bump
- Updated dependencies
  - @sonata-api/access-control@0.0.9
  - @sonata-api/common@0.0.9
  - @sonata-api/http@0.0.2
  - @sonata-api/mailing@0.0.4
  - @sonata-api/security@0.0.2
  - @sonata-api/system@0.0.21
  - @sonata-api/types@0.0.8
