// @flow
import {
  ARRAY_INSERT,
  ARRAY_MOVE,
  ARRAY_POP,
  ARRAY_PUSH,
  ARRAY_REMOVE,
  ARRAY_REMOVE_ALL,
  ARRAY_SHIFT,
  ARRAY_SPLICE,
  ARRAY_SWAP,
  ARRAY_UNSHIFT,
  AUTOFILL,
  BLUR,
  CHANGE,
  CLEAR_ASYNC_ERROR,
  CLEAR_SUBMIT,
  CLEAR_SUBMIT_ERRORS,
  DESTROY,
  FOCUS,
  INITIALIZE,
  prefix,
  REGISTER_FIELD,
  RESET,
  RESET_SECTION,
  SET_SUBMIT_FAILED,
  SET_SUBMIT_SUCCEEDED,
  START_ASYNC_VALIDATION,
  START_SUBMIT,
  STOP_ASYNC_VALIDATION,
  STOP_SUBMIT,
  SUBMIT,
  TOUCH,
  UNREGISTER_FIELD,
  UNTOUCH,
  UPDATE_SYNC_ERRORS,
  CLEAR_FIELDS,
  UPDATE_SYNC_WARNINGS
} from './actionTypes'
import createDeleteInWithCleanUp from './deleteInWithCleanUp'
import plain from './structure/plain'
import type { Action, Structure } from './types.js.flow'
import { isFunction } from 'lodash'

const shouldDelete = ({ getIn }) => (state, path) => {
  let initialValuesPath = null

  if (/^values/.test(path)) {
    initialValuesPath = path.replace('values', 'initial')
  }

  const initialValueComparison = initialValuesPath
    ? getIn(state, initialValuesPath) === undefined
    : true

  return getIn(state, path) !== undefined && initialValueComparison
}

const isReduxFormAction = action =>
  action &&
  action.type &&
  action.type.length > prefix.length &&
  action.type.substring(0, prefix.length) === prefix

function createReducer<M, L>(structure: Structure<M, L>) {
  const {
    deepEqual,
    empty,
    forEach,
    getIn,
    setIn,
    deleteIn,
    fromJS,
    keys,
    size,
    some,
    splice
  } = structure
  const deleteInWithCleanUp = createDeleteInWithCleanUp(structure)(shouldDelete)
  const plainDeleteInWithCleanUp = createDeleteInWithCleanUp(plain)(
    shouldDelete
  )
  const doSplice = (state, key, field, index, removeNum, value, force) => {
    const existing = getIn(state, `${key}.${field}`)
    return existing || force
      ? setIn(
          state,
          `${key}.${field}`,
          splice(existing, index, removeNum, value)
        )
      : state
  }
  const doPlainSplice = (state, key, field, index, removeNum, value, force) => {
    const slice = getIn(state, key)
    const existing = plain.getIn(slice, field)
    return existing || force
      ? setIn(
          state,
          key,
          plain.setIn(
            slice,
            field,
            plain.splice(existing, index, removeNum, value)
          )
        )
      : state
  }
  const rootKeys = ['values', 'fields', 'submitErrors', 'asyncErrors']
  const arraySplice = (state, field, index, removeNum, ...value) => {
    let result = state
    const realvalue = value.length == 0 ? undefined : value
    const nonValuesValue = Array.isArray(realvalue)
      ? value.map(value => (value != null ? empty : undefined))
      : undefined
    result = doSplice(result, 'values', field, index, removeNum, value, true)
    result = doSplice(result, 'fields', field, index, removeNum, nonValuesValue)
    result = doPlainSplice(
      result,
      'syncErrors',
      field,
      index,
      removeNum,
      undefined
    )
    result = doPlainSplice(
      result,
      'syncWarnings',
      field,
      index,
      removeNum,
      undefined
    )
    result = doSplice(
      result,
      'submitErrors',
      field,
      index,
      removeNum,
      undefined
    )
    result = doSplice(result, 'asyncErrors', field, index, removeNum, undefined)
    return result
  }

  const behaviors: { [string]: { (state: any, action: Action): M } } = {
    [ARRAY_INSERT](
      state,
      {
        meta: { field, index },
        payload
      }
    ) {
      return arraySplice(state, field, index, 0, payload)
    },
    [ARRAY_MOVE](
      state,
      {
        meta: { field, from, to }
      }
    ) {
      const array = getIn(state, `values.${field}`)
      const length = array ? size(array) : 0
      let result = state
      if (length) {
        rootKeys.forEach(key => {
          const path = `${key}.${field}`
          if (getIn(result, path)) {
            const value = getIn(result, `${path}[${from}]`)
            result = setIn(result, path, splice(getIn(result, path), from, 1)) // remove
            result = setIn(
              result,
              path,
              splice(getIn(result, path), to, 0, value)
            ) // insert
          }
        })
      }
      return result
    },
    [ARRAY_POP](
      state,
      {
        meta: { field }
      }
    ) {
      const array = getIn(state, `values.${field}`)
      const length = array ? size(array) : 0
      return length ? arraySplice(state, field, length - 1, 1) : state
    },
    [ARRAY_PUSH](
      state,
      {
        meta: { field },
        payload
      }
    ) {
      const array = getIn(state, `values.${field}`)
      const length = array ? size(array) : 0
      return arraySplice(state, field, length, 0, payload)
    },
    [ARRAY_REMOVE](
      state,
      {
        meta: { field, index }
      }
    ) {
      return arraySplice(state, field, index, 1)
    },
    [ARRAY_REMOVE_ALL](
      state,
      {
        meta: { field }
      }
    ) {
      const array = getIn(state, `values.${field}`)
      const length = array ? size(array) : 0
      return length ? arraySplice(state, field, 0, length) : state
    },
    [ARRAY_SHIFT](
      state,
      {
        meta: { field }
      }
    ) {
      return arraySplice(state, field, 0, 1)
    },
    [ARRAY_SPLICE](
      state,
      {
        meta: { field, index, removeNum },
        payload
      }
    ) {
      if (payload === undefined)
        return arraySplice(state, field, index, removeNum)
      else return arraySplice(state, field, index, removeNum, ...payload)
    },
    [ARRAY_SWAP](
      state,
      {
        meta: { field, indexA, indexB }
      }
    ) {
      let result = state
      rootKeys.forEach(key => {
        const valueA = getIn(result, `${key}.${field}[${indexA}]`)
        const valueB = getIn(result, `${key}.${field}[${indexB}]`)
        if (valueA !== undefined || valueB !== undefined) {
          result = setIn(result, `${key}.${field}[${indexA}]`, valueB)
          result = setIn(result, `${key}.${field}[${indexB}]`, valueA)
        }
      })
      return result
    },
    [ARRAY_UNSHIFT](
      state,
      {
        meta: { field },
        payload
      }
    ) {
      if (payload === undefined) return arraySplice(state, field, 0, 0, payload)
      else return arraySplice(state, field, 0, 0, ...payload)
    },
    [AUTOFILL](
      state,
      {
        meta: { field },
        payload
      }
    ) {
      let result: any = state
      result = deleteInWithCleanUp(result, `asyncErrors.${field}`)
      result = deleteInWithCleanUp(result, `submitErrors.${field}`)
      result = setIn(result, `fields.${field}.autofilled`, true)
      result = setIn(result, `values.${field}`, payload)
      return result
    },
    [BLUR](
      state,
      {
        meta: { field, touch },
        payload
      }
    ) {
      let result = state
      const initial = getIn(result, `initial.${field}`)
      if (initial === undefined && payload === '') {
        result = deleteInWithCleanUp(result, `values.${field}`)
      } else if (payload !== undefined) {
        result = setIn(result, `values.${field}`, payload)
      }
      if (field === getIn(result, 'active')) {
        result = deleteIn(result, 'active')
      }
      result = deleteIn(result, `fields.${field}.active`)
      if (touch) {
        result = setIn(result, `fields.${field}.touched`, true)
        result = setIn(result, 'anyTouched', true)
      }
      return result
    },
    [CHANGE](
      state,
      {
        meta: { field, touch, persistentSubmitErrors },
        payload
      }
    ) {
      let result = state
      const initial = getIn(result, `initial.${field}`)
      if ((initial === undefined && payload === '') || payload === undefined) {
        result = deleteInWithCleanUp(result, `values.${field}`)
      } else if (isFunction(payload)) {
        const fieldCurrentValue = getIn(state, `values.${field}`)
        result = setIn(
          result,
          `values.${field}`,
          payload(fieldCurrentValue, state.values)
        )
      } else {
        result = setIn(result, `values.${field}`, payload)
      }
      result = deleteInWithCleanUp(result, `asyncErrors.${field}`)
      if (!persistentSubmitErrors) {
        result = deleteInWithCleanUp(result, `submitErrors.${field}`)
      }
      result = deleteInWithCleanUp(result, `fields.${field}.autofilled`)
      if (touch) {
        result = setIn(result, `fields.${field}.touched`, true)
        result = setIn(result, 'anyTouched', true)
      }
      return result
    },
    [CLEAR_SUBMIT](state) {
      return deleteIn(state, 'triggerSubmit')
    },
    [CLEAR_SUBMIT_ERRORS](state) {
      let result = state
      result = deleteInWithCleanUp(result, 'submitErrors')
      result = deleteIn(result, 'error')
      return result
    },
    [CLEAR_ASYNC_ERROR](
      state,
      {
        meta: { field }
      }
    ) {
      return deleteIn(state, `asyncErrors.${field}`)
    },
    [CLEAR_FIELDS](
      state,
      {
        meta: { keepTouched, persistentSubmitErrors, fields }
      }
    ) {
      let result = state
      fields.forEach(field => {
        result = deleteInWithCleanUp(result, `asyncErrors.${field}`)
        if (!persistentSubmitErrors) {
          result = deleteInWithCleanUp(result, `submitErrors.${field}`)
        }
        result = deleteInWithCleanUp(result, `fields.${field}.autofilled`)
        if (!keepTouched) {
          result = deleteIn(result, `fields.${field}.touched`)
        }
        const values = getIn(state, `initial.${field}`)
        result = values
          ? setIn(result, `values.${field}`, values)
          : deleteInWithCleanUp(result, `values.${field}`)
      })
      const anyTouched = some(keys(getIn(result, 'registeredFields')), key =>
        getIn(result, `fields.${key}.touched`)
      )
      result = anyTouched
        ? setIn(result, 'anyTouched', true)
        : deleteIn(result, 'anyTouched')
      return result
    },
    [FOCUS](
      state,
      {
        meta: { field }
      }
    ) {
      let result = state
      const previouslyActive = getIn(state, 'active')
      result = deleteIn(result, `fields.${previouslyActive}.active`)
      result = setIn(result, `fields.${field}.visited`, true)
      result = setIn(result, `fields.${field}.active`, true)
      result = setIn(result, 'active', field)
      return result
    },
    [INITIALIZE](
      state,
      {
        payload,
        meta: {
          keepDirty,
          keepSubmitSucceeded,
          updateUnregisteredFields,
          keepValues
        }
      }
    ) {
      const mapData = fromJS(payload)
      let result = empty // clean all field state

      // persist old warnings, they will get recalculated if the new form values are different from the old values
      const warning = getIn(state, 'warning')
      if (warning) {
        result = setIn(result, 'warning', warning)
      }
      const syncWarnings = getIn(state, 'syncWarnings')
      if (syncWarnings) {
        result = setIn(result, 'syncWarnings', syncWarnings)
      }

      // persist old errors, they will get recalculated if the new form values are different from the old values
      const error = getIn(state, 'error')
      if (error) {
        result = setIn(result, 'error', error)
      }
      const syncErrors = getIn(state, 'syncErrors')
      if (syncErrors) {
        result = setIn(result, 'syncErrors', syncErrors)
      }

      const registeredFields = getIn(state, 'registeredFields')
      if (registeredFields) {
        result = setIn(result, 'registeredFields', registeredFields)
      }

      const previousValues = getIn(state, 'values')
      const previousInitialValues = getIn(state, 'initial')

      let newInitialValues = mapData
      let newValues = previousValues

      if (keepDirty && registeredFields) {
        if (!deepEqual(newInitialValues, previousInitialValues)) {
          //
          // Keep the value of dirty fields while updating the value of
          // pristine fields. This way, apps can reinitialize forms while
          // avoiding stomping on user edits.
          //
          // Note 1: The initialize action replaces all initial values
          // regardless of keepDirty.
          //
          // Note 2: When a field is dirty, keepDirty is enabled, and the field
          // value is the same as the new initial value for the field, the
          // initialize action causes the field to become pristine. That effect
          // is what we want.
          //
          const overwritePristineValue = name => {
            const previousInitialValue = getIn(previousInitialValues, name)
            const previousValue = getIn(previousValues, name)

            if (deepEqual(previousValue, previousInitialValue)) {
              // Overwrite the old pristine value with the new pristine value
              const newInitialValue = getIn(newInitialValues, name)

              // This check prevents any 'setIn' call that would create useless
              // nested objects, since the path to the new field value would
              // evaluate to the same (especially for undefined values)
              if (getIn(newValues, name) !== newInitialValue) {
                newValues = setIn(newValues, name, newInitialValue)
              }
            }
          }

          if (!updateUnregisteredFields) {
            forEach(keys(registeredFields), name =>
              overwritePristineValue(name)
            )
          }

          forEach(keys(newInitialValues), name => {
            const previousInitialValue = getIn(previousInitialValues, name)
            if (typeof previousInitialValue === 'undefined') {
              // Add new values at the root level.
              const newInitialValue = getIn(newInitialValues, name)
              newValues = setIn(newValues, name, newInitialValue)
            }

            if (updateUnregisteredFields) {
              overwritePristineValue(name)
            }
          })
        }
      } else {
        newValues = newInitialValues
      }

      if (keepValues) {
        forEach(keys(previousValues), name => {
          const previousValue = getIn(previousValues, name)

          newValues = setIn(newValues, name, previousValue)
        })

        forEach(keys(previousInitialValues), name => {
          const previousInitialValue = getIn(previousInitialValues, name)

          newInitialValues = setIn(newInitialValues, name, previousInitialValue)
        })
      }

      if (keepSubmitSucceeded && getIn(state, 'submitSucceeded')) {
        result = setIn(result, 'submitSucceeded', true)
      }
      result = setIn(result, 'values', newValues)
      result = setIn(result, 'initial', newInitialValues)
      return result
    },
    [REGISTER_FIELD](
      state,
      {
        payload: { name, type }
      }
    ) {
      const key = `registeredFields['${name}']`
      let field = getIn(state, key)
      if (field) {
        const count = getIn(field, 'count') + 1
        field = setIn(field, 'count', count)
      } else {
        field = fromJS({ name, type, count: 1 })
      }
      return setIn(state, key, field)
    },
    [RESET](state) {
      let result = empty
      const registeredFields = getIn(state, 'registeredFields')
      if (registeredFields) {
        result = setIn(result, 'registeredFields', registeredFields)
      }
      const values = getIn(state, 'initial')
      if (values) {
        result = setIn(result, 'values', values)
        result = setIn(result, 'initial', values)
      }
      return result
    },
    [RESET_SECTION](
      state,
      {
        meta: { sections }
      }
    ) {
      let result = state

      sections.forEach(section => {
        result = deleteInWithCleanUp(result, `asyncErrors.${section}`)
        result = deleteInWithCleanUp(result, `submitErrors.${section}`)
        result = deleteInWithCleanUp(result, `fields.${section}`)

        const values = getIn(state, `initial.${section}`)
        result = values
          ? setIn(result, `values.${section}`, values)
          : deleteInWithCleanUp(result, `values.${section}`)
      })

      const anyTouched = some(keys(getIn(result, 'registeredFields')), key =>
        getIn(result, `fields.${key}.touched`)
      )
      result = anyTouched
        ? setIn(result, 'anyTouched', true)
        : deleteIn(result, 'anyTouched')

      return result
    },
    [SUBMIT](state) {
      return setIn(state, 'triggerSubmit', true)
    },
    [START_ASYNC_VALIDATION](
      state,
      {
        meta: { field }
      }
    ) {
      return setIn(state, 'asyncValidating', field || true)
    },
    [START_SUBMIT](state) {
      return setIn(state, 'submitting', true)
    },
    [STOP_ASYNC_VALIDATION](state, { payload }) {
      let result = state
      result = deleteIn(result, 'asyncValidating')
      if (payload && Object.keys(payload).length) {
        const { _error, ...fieldErrors } = payload
        if (_error) {
          result = setIn(result, 'error', _error)
        }
        if (Object.keys(fieldErrors).length) {
          result = setIn(result, 'asyncErrors', fromJS(fieldErrors))
        }
      } else {
        result = deleteIn(result, 'error')
        result = deleteIn(result, 'asyncErrors')
      }
      return result
    },
    [STOP_SUBMIT](state, { payload }) {
      let result = state
      result = deleteIn(result, 'submitting')
      result = deleteIn(result, 'submitFailed')
      result = deleteIn(result, 'submitSucceeded')
      if (payload && Object.keys(payload).length) {
        const { _error, ...fieldErrors } = payload
        if (_error) {
          result = setIn(result, 'error', _error)
        } else {
          result = deleteIn(result, 'error')
        }
        if (Object.keys(fieldErrors).length) {
          result = setIn(result, 'submitErrors', fromJS(fieldErrors))
        } else {
          result = deleteIn(result, 'submitErrors')
        }
        result = setIn(result, 'submitFailed', true)
      } else {
        result = deleteIn(result, 'error')
        result = deleteIn(result, 'submitErrors')
      }
      return result
    },
    [SET_SUBMIT_FAILED](
      state,
      {
        meta: { fields }
      }
    ) {
      let result = state
      result = setIn(result, 'submitFailed', true)
      result = deleteIn(result, 'submitSucceeded')
      result = deleteIn(result, 'submitting')
      fields.forEach(
        field => (result = setIn(result, `fields.${field}.touched`, true))
      )
      if (fields.length) {
        result = setIn(result, 'anyTouched', true)
      }
      return result
    },
    [SET_SUBMIT_SUCCEEDED](state) {
      let result = state
      result = deleteIn(result, 'submitFailed')
      result = setIn(result, 'submitSucceeded', true)
      return result
    },
    [TOUCH](
      state,
      {
        meta: { fields }
      }
    ) {
      let result = state
      fields.forEach(
        field => (result = setIn(result, `fields.${field}.touched`, true))
      )
      result = setIn(result, 'anyTouched', true)
      return result
    },
    [UNREGISTER_FIELD](
      state,
      {
        payload: { name, destroyOnUnmount }
      }
    ) {
      let result = state
      const key = `registeredFields['${name}']`
      let field = getIn(result, key)
      if (!field) {
        return result
      }

      const count = getIn(field, 'count') - 1
      if (count <= 0 && destroyOnUnmount) {
        // Note: Cannot use deleteWithCleanUp here because of the flat nature of registeredFields
        result = deleteIn(result, key)
        if (deepEqual(getIn(result, 'registeredFields'), empty)) {
          result = deleteIn(result, 'registeredFields')
        }
        let syncErrors = getIn(result, 'syncErrors')
        if (syncErrors) {
          syncErrors = plainDeleteInWithCleanUp(syncErrors, name)
          if (plain.deepEqual(syncErrors, plain.empty)) {
            result = deleteIn(result, 'syncErrors')
          } else {
            result = setIn(result, 'syncErrors', syncErrors)
          }
        }
        let syncWarnings = getIn(result, 'syncWarnings')
        if (syncWarnings) {
          syncWarnings = plainDeleteInWithCleanUp(syncWarnings, name)
          if (plain.deepEqual(syncWarnings, plain.empty)) {
            result = deleteIn(result, 'syncWarnings')
          } else {
            result = setIn(result, 'syncWarnings', syncWarnings)
          }
        }
        result = deleteInWithCleanUp(result, `submitErrors.${name}`)
        result = deleteInWithCleanUp(result, `asyncErrors.${name}`)
      } else {
        field = setIn(field, 'count', count)
        result = setIn(result, key, field)
      }
      return result
    },
    [UNTOUCH](
      state,
      {
        meta: { fields }
      }
    ) {
      let result = state
      fields.forEach(
        field => (result = deleteIn(result, `fields.${field}.touched`))
      )
      const anyTouched = some(keys(getIn(result, 'registeredFields')), key =>
        getIn(result, `fields.${key}.touched`)
      )
      result = anyTouched
        ? setIn(result, 'anyTouched', true)
        : deleteIn(result, 'anyTouched')
      return result
    },
    [UPDATE_SYNC_ERRORS](
      state,
      {
        payload: { syncErrors, error }
      }
    ) {
      let result = state
      if (error) {
        result = setIn(result, 'error', error)
        result = setIn(result, 'syncError', true)
      } else {
        result = deleteIn(result, 'error')
        result = deleteIn(result, 'syncError')
      }
      if (Object.keys(syncErrors).length) {
        result = setIn(result, 'syncErrors', syncErrors)
      } else {
        result = deleteIn(result, 'syncErrors')
      }
      return result
    },
    [UPDATE_SYNC_WARNINGS](
      state,
      {
        payload: { syncWarnings, warning }
      }
    ) {
      let result = state
      if (warning) {
        result = setIn(result, 'warning', warning)
      } else {
        result = deleteIn(result, 'warning')
      }
      if (Object.keys(syncWarnings).length) {
        result = setIn(result, 'syncWarnings', syncWarnings)
      } else {
        result = deleteIn(result, 'syncWarnings')
      }
      return result
    }
  }

  const reducer = (state: any = empty, action: Action) => {
    const behavior = behaviors[action.type]
    return behavior ? behavior(state, action) : state
  }

  const byForm = reducer => (
    state: any = empty,
    action: Action = { type: 'NONE' }
  ) => {
    const form = action && action.meta && action.meta.form
    if (!form || !isReduxFormAction(action)) {
      return state
    }
    if (action.type === DESTROY && action.meta && action.meta.form) {
      return action.meta.form.reduce(
        (result, form) => deleteInWithCleanUp(result, form),
        state
      )
    }
    const formState = getIn(state, form)
    const result = reducer(formState, action)
    return result === formState ? state : setIn(state, form, result)
  }

  /**
   * Adds additional functionality to the reducer
   */
  function decorate(target) {
    target.plugin = function(reducers, config = {}) {
      // use 'function' keyword to enable 'this'
      return decorate(
        (state: any = empty, action: Action = { type: 'NONE' }) => {
          const callPlugin = (processed: any, key: string) => {
            const previousState = getIn(processed, key)
            const nextState = reducers[key](
              previousState,
              action,
              getIn(state, key)
            )
            return nextState !== previousState
              ? setIn(processed, key, nextState)
              : processed
          }

          const processed = this(state, action) // run through redux-form reducer
          const form = action && action.meta && action.meta.form

          if (form && !config.receiveAllFormActions) {
            // this is an action aimed at forms, so only give it to the specified form's plugin
            return reducers[form] ? callPlugin(processed, form) : processed
          } else {
            // this is not a form-specific action, so send it to all the plugins
            return Object.keys(reducers).reduce(callPlugin, processed)
          }
        }
      )
    }

    return target
  }

  return decorate(byForm(reducer))
}

export default createReducer
