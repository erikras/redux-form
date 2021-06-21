import handleSubmit from '../handleSubmit'
import { SubmissionError } from '../SubmissionError'
import { noop } from 'lodash'

describe('handleSubmit', () => {
  it('should stop if sync validation fails', () => {
    expect.assertions(7)

    const values = { foo: 'bar', baz: 42 }
    const submit = jest.fn().mockImplementation(() => 69)
    const startSubmit = jest.fn()
    const stopSubmit = jest.fn()
    const touch = jest.fn()
    const setSubmitFailed = jest.fn()
    const setSubmitSucceeded = jest.fn()
    const asyncValidate = jest.fn()
    const props = {
      startSubmit,
      stopSubmit,
      touch,
      setSubmitFailed,
      setSubmitSucceeded,
      values
    }

    handleSubmit(submit, props, false, asyncValidate, ['foo', 'baz'])

    expect(submit).not.toHaveBeenCalled()
    expect(startSubmit).not.toHaveBeenCalled()
    expect(stopSubmit).not.toHaveBeenCalled()
    expect(touch).toHaveBeenCalledWith('foo', 'baz')
    expect(asyncValidate).not.toHaveBeenCalled()
    expect(setSubmitSucceeded).not.toHaveBeenCalled()
    expect(setSubmitFailed).toHaveBeenCalledWith('foo', 'baz')
  })

  it('should stop and return errors if sync validation fails', () => {
    expect.assertions(8)

    const values = { foo: 'bar', baz: 42 }
    const submit = jest.fn().mockImplementation(() => 69)
    const syncErrors = { foo: 'error' }
    const startSubmit = jest.fn()
    const stopSubmit = jest.fn()
    const touch = jest.fn()
    const setSubmitFailed = jest.fn()
    const setSubmitSucceeded = jest.fn()
    const asyncValidate = jest.fn()
    const props = {
      startSubmit,
      stopSubmit,
      touch,
      setSubmitFailed,
      setSubmitSucceeded,
      syncErrors,
      values
    }

    const result = handleSubmit(submit, props, false, asyncValidate, ['foo', 'baz'])

    expect(asyncValidate).not.toHaveBeenCalled()
    expect(submit).not.toHaveBeenCalled()
    expect(startSubmit).not.toHaveBeenCalled()
    expect(stopSubmit).not.toHaveBeenCalled()
    expect(touch).toHaveBeenCalledWith('foo', 'baz')
    expect(setSubmitSucceeded).not.toHaveBeenCalled()
    expect(setSubmitFailed).toHaveBeenCalledWith('foo', 'baz')
    expect(result).toEqual(syncErrors)
  })

  it('should return result of sync submit', () => {
    expect.assertions(7)

    const values = { foo: 'bar', baz: 42 }
    const submit = jest.fn().mockImplementation(() => 69)
    const dispatch = noop
    const startSubmit = jest.fn()
    const stopSubmit = jest.fn()
    const touch = jest.fn()
    const setSubmitFailed = jest.fn()
    const setSubmitSucceeded = jest.fn()
    const asyncValidate = undefined
    const props = {
      dispatch,
      startSubmit,
      stopSubmit,
      touch,
      setSubmitFailed,
      setSubmitSucceeded,
      values
    }

    expect(handleSubmit(submit, props, true, asyncValidate, ['foo', 'baz'])).toBe(69)

    expect(submit).toHaveBeenCalledWith(values, dispatch, props)
    expect(startSubmit).not.toHaveBeenCalled()
    expect(stopSubmit).not.toHaveBeenCalled()
    expect(touch).toHaveBeenCalledWith('foo', 'baz')
    expect(setSubmitFailed).not.toHaveBeenCalled()
    expect(setSubmitSucceeded).toHaveBeenCalled()
  })

  it('should not submit if async validation fails', () => {
    expect.assertions(8)

    const values = { foo: 'bar', baz: 42 }
    const submit = jest.fn().mockImplementation(() => 69)
    const dispatch = noop
    const startSubmit = jest.fn()
    const stopSubmit = jest.fn()
    const touch = jest.fn()
    const setSubmitFailed = jest.fn()
    const setSubmitSucceeded = jest.fn()
    const asyncValidate = jest.fn().mockImplementation(() => Promise.resolve(values))
    const props = {
      dispatch,
      startSubmit,
      stopSubmit,
      touch,
      setSubmitFailed,
      setSubmitSucceeded,
      values
    }

    return handleSubmit(submit, props, true, asyncValidate, ['foo', 'baz']).then(result => {
      expect(result).toBe(values)
      expect(asyncValidate).toHaveBeenCalledWith()
      expect(submit).not.toHaveBeenCalled()
      expect(startSubmit).not.toHaveBeenCalled()
      expect(stopSubmit).not.toHaveBeenCalled()
      expect(touch).toHaveBeenCalledWith('foo', 'baz')
      expect(setSubmitSucceeded).not.toHaveBeenCalled()
      expect(setSubmitFailed).toHaveBeenCalledWith('foo', 'baz')
    })
  })

  it('should call onSubmitFail with async errors and dispatch if async validation fails and onSubmitFail is defined', () => {
    expect.assertions(13)

    const values = { foo: 'bar', baz: 42 }
    const submit = jest.fn().mockImplementation(() => 69)
    const dispatch = noop
    const startSubmit = jest.fn()
    const stopSubmit = jest.fn()
    const onSubmitFail = jest.fn()
    const touch = jest.fn()
    const setSubmitFailed = jest.fn()
    const setSubmitSucceeded = jest.fn()
    const asyncValidate = jest.fn().mockImplementation(() => Promise.resolve(values))
    const props = {
      dispatch,
      onSubmitFail,
      startSubmit,
      stopSubmit,
      touch,
      setSubmitFailed,
      setSubmitSucceeded,
      values
    }

    return handleSubmit(submit, props, true, asyncValidate, ['foo', 'baz']).then(result => {
      expect(result).toBe(values)
      expect(asyncValidate).toHaveBeenCalledWith()
      expect(submit).not.toHaveBeenCalled()
      expect(startSubmit).not.toHaveBeenCalled()
      expect(stopSubmit).not.toHaveBeenCalled()
      expect(onSubmitFail).toHaveBeenCalled()
      expect(onSubmitFail.mock.calls[0][0]).toEqual(values)
      expect(onSubmitFail.mock.calls[0][1]).toEqual(dispatch)
      expect(onSubmitFail.mock.calls[0][2]).toBe(null)
      expect(onSubmitFail.mock.calls[0][3]).toEqual(props)
      expect(touch).toHaveBeenCalledWith('foo', 'baz')
      expect(setSubmitSucceeded).not.toHaveBeenCalled()
      expect(setSubmitFailed).toHaveBeenCalledWith('foo', 'baz')
    })
  })

  it('should not submit if async validation fails and returns errors', () => {
    expect.assertions(8)

    const values = { foo: 'bar', baz: 42 }
    const submit = jest.fn().mockImplementation(() => 69)
    const dispatch = noop
    const startSubmit = jest.fn()
    const stopSubmit = jest.fn()
    const touch = jest.fn()
    const setSubmitFailed = jest.fn()
    const setSubmitSucceeded = jest.fn()
    const asyncErrors = { foo: 'async error' }
    const asyncValidate = jest.fn().mockImplementation(() => Promise.reject(asyncErrors))
    const props = {
      dispatch,
      startSubmit,
      stopSubmit,
      touch,
      setSubmitFailed,
      setSubmitSucceeded,
      values
    }

    return handleSubmit(submit, props, true, asyncValidate, ['foo', 'baz']).then(result => {
      expect(result).toBe(asyncErrors)
      expect(asyncValidate).toHaveBeenCalledWith()
      expect(submit).not.toHaveBeenCalled()
      expect(startSubmit).not.toHaveBeenCalled()
      expect(stopSubmit).not.toHaveBeenCalled()
      expect(touch).toHaveBeenCalledWith('foo', 'baz')
      expect(setSubmitSucceeded).not.toHaveBeenCalled()
      expect(setSubmitFailed).toHaveBeenCalledWith('foo', 'baz')
    })
  })

  it('should sync submit if async validation passes', () => {
    expect.assertions(8)

    const values = { foo: 'bar', baz: 42 }
    const submit = jest.fn().mockImplementation(() => 69)
    const dispatch = noop
    const startSubmit = jest.fn()
    const stopSubmit = jest.fn()
    const touch = jest.fn()
    const setSubmitFailed = jest.fn()
    const setSubmitSucceeded = jest.fn()
    const asyncValidate = jest.fn().mockImplementation(() => Promise.resolve())
    const props = {
      dispatch,
      startSubmit,
      stopSubmit,
      touch,
      setSubmitFailed,
      setSubmitSucceeded,
      values
    }

    return handleSubmit(submit, props, true, asyncValidate, ['foo', 'baz']).then(result => {
      expect(result).toBe(69)
      expect(asyncValidate).toHaveBeenCalledWith()
      expect(submit).toHaveBeenCalledWith(values, dispatch, props)
      expect(startSubmit).not.toHaveBeenCalled()
      expect(stopSubmit).not.toHaveBeenCalled()
      expect(touch).toHaveBeenCalledWith('foo', 'baz')
      expect(setSubmitFailed).not.toHaveBeenCalled()
      expect(setSubmitSucceeded).toHaveBeenCalled()
    })
  })

  it('should async submit if async validation passes', () => {
    expect.assertions(8)

    const values = { foo: 'bar', baz: 42 }
    const submit = jest.fn().mockImplementation(() => Promise.resolve(69))
    const dispatch = noop
    const startSubmit = jest.fn()
    const stopSubmit = jest.fn()
    const touch = jest.fn()
    const setSubmitFailed = jest.fn()
    const setSubmitSucceeded = jest.fn()
    const asyncValidate = jest.fn().mockImplementation(() => Promise.resolve())
    const props = {
      dispatch,
      startSubmit,
      stopSubmit,
      touch,
      setSubmitFailed,
      setSubmitSucceeded,
      values
    }

    return handleSubmit(submit, props, true, asyncValidate, ['foo', 'baz']).then(result => {
      expect(result).toBe(69)
      expect(asyncValidate).toHaveBeenCalledWith()
      expect(submit).toHaveBeenCalledWith(values, dispatch, props)
      expect(startSubmit).toHaveBeenCalled()
      expect(stopSubmit).toHaveBeenCalledWith()
      expect(touch).toHaveBeenCalledWith('foo', 'baz')
      expect(setSubmitFailed).not.toHaveBeenCalled()
      expect(setSubmitSucceeded).toHaveBeenCalled()
    })
  })

  it('should set submit errors if async submit fails', () => {
    expect.assertions(8)

    const values = { foo: 'bar', baz: 42 }
    const submitErrors = { foo: 'submit error' }
    const submit = jest
      .fn()
      .mockImplementation(() => Promise.reject(new SubmissionError(submitErrors)))
    const dispatch = noop
    const startSubmit = jest.fn()
    const stopSubmit = jest.fn()
    const touch = jest.fn()
    const setSubmitFailed = jest.fn()
    const setSubmitSucceeded = jest.fn()
    const asyncValidate = jest.fn().mockImplementation(() => Promise.resolve())
    const props = {
      dispatch,
      startSubmit,
      stopSubmit,
      touch,
      setSubmitFailed,
      setSubmitSucceeded,
      values
    }

    return handleSubmit(submit, props, true, asyncValidate, ['foo', 'baz']).then(error => {
      expect(error).toBe(submitErrors)
      expect(asyncValidate).toHaveBeenCalledWith()
      expect(submit).toHaveBeenCalledWith(values, dispatch, props)
      expect(startSubmit).toHaveBeenCalled()
      expect(stopSubmit).toHaveBeenCalledWith(submitErrors)
      expect(touch).toHaveBeenCalledWith('foo', 'baz')
      expect(setSubmitFailed).toHaveBeenCalled()
      expect(setSubmitSucceeded).not.toHaveBeenCalled()
    })
  })

  it('should not set errors if rejected value not a SubmissionError', () => {
    expect.assertions(9)

    const values = { foo: 'bar', baz: 42 }
    const submitErrors = { foo: 'submit error' }
    const submit = jest.fn().mockImplementation(() => Promise.reject(submitErrors))
    const dispatch = noop
    const startSubmit = jest.fn()
    const stopSubmit = jest.fn()
    const touch = jest.fn()
    const setSubmitFailed = jest.fn()
    const setSubmitSucceeded = jest.fn()
    const asyncValidate = jest.fn().mockImplementation(() => Promise.resolve())
    const props = {
      dispatch,
      startSubmit,
      stopSubmit,
      touch,
      setSubmitFailed,
      setSubmitSucceeded,
      values
    }

    const resolveSpy = jest.fn()
    const errorSpy = jest.fn()

    return handleSubmit(submit, props, true, asyncValidate, ['foo', 'baz'])
      .then(resolveSpy, errorSpy)
      .then(() => {
        expect(resolveSpy).toHaveBeenCalledWith(submitErrors)
        expect(errorSpy).not.toHaveBeenCalled()
        expect(asyncValidate).toHaveBeenCalledWith()
        expect(submit).toHaveBeenCalledWith(values, dispatch, props)
        expect(startSubmit).toHaveBeenCalled()
        expect(stopSubmit).toHaveBeenCalledWith(undefined) // not wrapped in SubmissionError
        expect(touch).toHaveBeenCalledWith('foo', 'baz')
        expect(setSubmitFailed).toHaveBeenCalled()
        expect(setSubmitSucceeded).not.toHaveBeenCalled()
      })
  })

  it('should set submit errors if async submit fails and return rejected promise', () => {
    expect.assertions(8)

    const values = { foo: 'bar', baz: 42 }
    const submitErrors = { foo: 'submit error' }
    const submit = jest
      .fn()
      .mockImplementation(() => Promise.reject(new SubmissionError(submitErrors)))
    const dispatch = noop
    const startSubmit = jest.fn()
    const stopSubmit = jest.fn()
    const touch = jest.fn()
    const setSubmitFailed = jest.fn()
    const setSubmitSucceeded = jest.fn()
    const asyncValidate = jest.fn().mockImplementation(() => Promise.resolve())
    const props = {
      dispatch,
      startSubmit,
      stopSubmit,
      touch,
      setSubmitFailed,
      setSubmitSucceeded,
      values
    }

    return handleSubmit(submit, props, true, asyncValidate, ['foo', 'baz']).then(error => {
      expect(error).toBe(submitErrors)
      expect(asyncValidate).toHaveBeenCalledWith()
      expect(submit).toHaveBeenCalledWith(values, dispatch, props)
      expect(startSubmit).toHaveBeenCalled()
      expect(stopSubmit).toHaveBeenCalledWith(submitErrors)
      expect(touch).toHaveBeenCalledWith('foo', 'baz')
      expect(setSubmitFailed).toHaveBeenCalled()
      expect(setSubmitSucceeded).not.toHaveBeenCalled()
    })
  })

  it('should submit when there are old submit errors and persistentSubmitErrors is enabled', () => {
    expect.assertions(1)

    const values = { foo: 'bar', baz: 42 }
    const submit = jest.fn().mockImplementation(() => 69)
    const startSubmit = jest.fn()
    const stopSubmit = jest.fn()
    const touch = jest.fn()
    const setSubmitFailed = jest.fn()
    const setSubmitSucceeded = jest.fn()
    const asyncValidate = jest.fn()
    const props = {
      startSubmit,
      stopSubmit,
      touch,
      setSubmitFailed,
      setSubmitSucceeded,
      values,
      persistentSubmitErrors: true
    }

    handleSubmit(submit, props, true, asyncValidate, ['foo', 'baz'])

    expect(submit).toHaveBeenCalled()
  })

  it('should not swallow errors', () => {
    expect.assertions(2)

    const values = { foo: 'bar', baz: 42 }
    const submit = jest.fn().mockImplementation(() => {
      throw new Error('spline reticulation failed')
    })
    const startSubmit = jest.fn()
    const stopSubmit = jest.fn()
    const touch = jest.fn()
    const setSubmitFailed = jest.fn()
    const setSubmitSucceeded = jest.fn()
    const asyncValidate = jest.fn()
    const props = {
      startSubmit,
      stopSubmit,
      touch,
      setSubmitFailed,
      setSubmitSucceeded,
      values
    }

    expect(() => handleSubmit(submit, props, true, asyncValidate, ['foo', 'baz'])).toThrow(
      'spline reticulation failed'
    )
    expect(submit).toHaveBeenCalled()
  })

  it('should not swallow async errors', () => {
    expect.assertions(3)

    const values = { foo: 'bar', baz: 42 }
    const submit = jest
      .fn()
      .mockImplementation(() => Promise.reject(new Error('spline reticulation failed')))
    const startSubmit = jest.fn()
    const stopSubmit = jest.fn()
    const touch = jest.fn()
    const setSubmitFailed = jest.fn()
    const setSubmitSucceeded = jest.fn()
    const asyncValidate = jest.fn()
    const props = {
      startSubmit,
      stopSubmit,
      touch,
      setSubmitFailed,
      setSubmitSucceeded,
      values
    }

    const resultSpy = jest.fn()
    const errorSpy = jest.fn()

    return handleSubmit(submit, props, true, asyncValidate, ['foo', 'baz'])
      .then(resultSpy, errorSpy)
      .then(() => {
        expect(submit).toHaveBeenCalled()
        expect(resultSpy).not.toHaveBeenCalled()
        expect(errorSpy).toHaveBeenCalled()
      })
  })

  it('should not swallow async errors when form is invalid', () => {
    expect.assertions(8)

    const values = { foo: 'bar', baz: 42 }
    const submit = jest.fn().mockImplementation(() => 69)
    const syncErrors = { baz: 'sync error' }
    const asyncErrors = { foo: 'async error' }
    const startSubmit = jest.fn()
    const stopSubmit = jest.fn()
    const touch = jest.fn()
    const setSubmitFailed = jest.fn()
    const setSubmitSucceeded = jest.fn()
    const asyncValidate = jest.fn()
    const props = {
      startSubmit,
      stopSubmit,
      touch,
      setSubmitFailed,
      setSubmitSucceeded,
      syncErrors,
      asyncErrors,
      values
    }

    const result = handleSubmit(submit, props, false, asyncValidate, ['foo', 'baz'])

    expect(asyncValidate).not.toHaveBeenCalled()
    expect(submit).not.toHaveBeenCalled()
    expect(startSubmit).not.toHaveBeenCalled()
    expect(stopSubmit).not.toHaveBeenCalled()
    expect(touch).toHaveBeenCalledWith('foo', 'baz')
    expect(setSubmitSucceeded).not.toHaveBeenCalled()
    expect(setSubmitFailed).toHaveBeenCalledWith('foo', 'baz')
    expect(result).toEqual({ ...asyncErrors, ...syncErrors })
  })

  it('should dispatch submission', () => {
    expect.assertions(8)

    const values = { foo: 'bar', baz: 42 }
    const mockAction = {}
    const submit = jest.fn().mockImplementation(() => mockAction)

    const dispatch = jest.fn()
    const startSubmit = jest.fn()
    const stopSubmit = jest.fn()
    const touch = jest.fn()
    const setSubmitFailed = jest.fn()
    const setSubmitSucceeded = jest.fn()
    const asyncValidate = undefined
    const submitAsSideEffect = true
    const props = {
      dispatch,
      startSubmit,
      stopSubmit,
      touch,
      setSubmitFailed,
      setSubmitSucceeded,
      submitAsSideEffect,
      values
    }

    expect(handleSubmit(submit, props, true, asyncValidate, ['foo', 'baz'])).toBe(mockAction)

    expect(submit).toHaveBeenCalledWith(values, dispatch, props)
    expect(dispatch).toHaveBeenCalledWith(mockAction)
    expect(startSubmit).not.toHaveBeenCalled()
    expect(stopSubmit).not.toHaveBeenCalled()
    expect(touch).toHaveBeenCalledWith('foo', 'baz')
    expect(setSubmitFailed).not.toHaveBeenCalled()
    expect(setSubmitSucceeded).not.toHaveBeenCalled()
  })
})
