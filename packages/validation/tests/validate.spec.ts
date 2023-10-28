import assert from 'assert'
import { unwrapEither, isLeft, isRight } from '@sonata-api/common'
import { validate } from '../dist'

import {
  plainCandidate,
  plainDescription,
  deepCandidate,
  deepDescription

} from './fixtures'

describe('Validate', () => {
  it('validates plain object', () => {
    const validationEither = validate(plainCandidate, plainDescription)
    assert(isRight(validationEither))
    assert(JSON.stringify(plainCandidate) === JSON.stringify(unwrapEither(validationEither)))
  })

  it('returns error on plain object', () => {
    const candidate = Object.assign({}, plainCandidate)
    candidate.age = '0' as any

    const validationEither = validate(candidate, plainDescription)

    assert(isLeft(validationEither))
    const error = unwrapEither(validationEither)
    assert(error.code === 'INVALID_PROPERTIES')
  })

  it('validates deep object', () => {
    const validationEither = validate(deepCandidate, deepDescription)

    assert(isRight(validationEither))
    assert(JSON.stringify(deepCandidate) === JSON.stringify(unwrapEither(validationEither)))
  })

  it('returns error on deep object', () => {
    const candidate = Object.assign({}, deepCandidate)
    deepCandidate.style.color.name.name = 1 as any

    const validationEither = validate(candidate, deepDescription)

    assert(isLeft(validationEither))
    const error = unwrapEither(validationEither)
    assert(error.code === 'INVALID_PROPERTIES')
  })

})
