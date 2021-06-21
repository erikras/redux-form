// @flow
import isPromise from 'is-promise'
import type { SubmitFunction } from './types'
import type { Props } from './createReduxForm'
import { isSubmissionError } from './SubmissionError'

const mergeErrors = ({ asyncErrors, syncErrors }) =>
  asyncErrors && typeof asyncErrors.merge === 'function'
    ? asyncErrors.merge(syncErrors).toJS()
    : { ...asyncErrors, ...syncErrors }

const executeSubmit = (submit: SubmitFunction, fields: string[], props: Props) => {
  const {
    dispatch,
    submitAsSideEffect,
    onSubmitFail,
    onSubmitSuccess,
    startSubmit,
    stopSubmit,
    setSubmitFailed,
    setSubmitSucceeded,
    values
  } = props

  let result
  try {
    result = submit(values, dispatch, props)
  } catch (submitError) {
    const error = isSubmissionError(submitError) ? submitError.errors : undefined
    stopSubmit(error)
    setSubmitFailed(...fields)
    if (onSubmitFail) {
      onSubmitFail(error, dispatch, submitError, props)
    }
    if (error || onSubmitFail) {
      // if you've provided an onSubmitFail callback, don't re-throw the error
      return error
    } else {
      throw submitError
    }
  }
  if (submitAsSideEffect) {
    if (result) {
      dispatch(result)
    }
  } else {
    if (isPromise(result)) {
      startSubmit()
      return result.then(
        submitResult => {
          stopSubmit()
          setSubmitSucceeded()
          if (onSubmitSuccess) {
            onSubmitSuccess(submitResult, dispatch, props)
          }
          return submitResult
        },
        submitError => {
          const error = isSubmissionError(submitError) ? submitError.errors : undefined
          stopSubmit(error)
          setSubmitFailed(...fields)
          if (onSubmitFail) {
            onSubmitFail(error, dispatch, submitError, props)
          }
          if (error || onSubmitFail) {
            // if you've provided an onSubmitFail callback, don't re-throw the error
            return error
          } else {
            throw submitError
          }
        }
      )
    } else {
      setSubmitSucceeded()
      if (onSubmitSuccess) {
        onSubmitSuccess(result, dispatch, props)
      }
    }
  }

  return result
}

const handleSubmit = (
  submit: SubmitFunction,
  props: Props,
  valid: boolean,
  asyncValidate: Function,
  fields: string[]
) => {
  const {
    dispatch,
    onSubmitFail,
    setSubmitFailed,
    syncErrors,
    asyncErrors,
    touch,
    persistentSubmitErrors
  } = props

  touch(...fields)

  if (valid || persistentSubmitErrors) {
    const asyncValidateResult = asyncValidate && asyncValidate()
    if (asyncValidateResult) {
      return asyncValidateResult
        .then(asyncErrors => {
          if (asyncErrors) {
            throw asyncErrors
          }
          return executeSubmit(submit, fields, props)
        })
        .catch(asyncErrors => {
          setSubmitFailed(...fields)
          if (onSubmitFail) {
            onSubmitFail(asyncErrors, dispatch, null, props)
          }
          return asyncErrors
        })
    } else {
      return executeSubmit(submit, fields, props)
    }
  } else {
    setSubmitFailed(...fields)
    const errors = mergeErrors({ asyncErrors, syncErrors })
    if (onSubmitFail) {
      onSubmitFail(errors, dispatch, null, props)
    }
    return errors
  }
}

export default handleSubmit
