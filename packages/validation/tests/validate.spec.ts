import type { Description } from '@sonata-api/types'
import assert from 'assert'
import { unwrapEither, isLeft, isRight } from '@sonata-api/common'
import { validate } from '../dist'

const description: Omit<Description, '$id'> = {
  properties: {
    name: {
      type: 'string'
    },
    age: {
      type: 'number'
    }
  }
}

describe('Validate', () => {
  it('validates with no errors', async () => {
    const candidate = {
      name: 'Terry',
      age: 50
    }

    const validationEither = await validate(description, candidate)
    assert(isRight(validationEither))
    assert(JSON.stringify(candidate) === JSON.stringify(unwrapEither(validationEither)))
  })

  it('returns error on invalid type', async () => {
    const candidate = {
      name: 'Terry',
      age: '50'
    }

    const validationEither = await validate(description, candidate)

    assert(isLeft(validationEither))
    const error = unwrapEither(validationEither)

    assert(error.code === 'INVALID_PROPERTIES')
    assert(error.errors?.age?.type === 'unmatching')
    assert(error.errors?.age?.details.expected === 'number')
    assert(error.errors?.age?.details.got === 'string')
  })


})
