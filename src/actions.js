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
  CLEAR_SUBMIT,
  CLEAR_SUBMIT_ERRORS,
  CLEAR_ASYNC_ERROR,
  DESTROY,
  FOCUS,
  INITIALIZE,
  REGISTER_FIELD,
  RESET,
  RESET_SECTION,
  CLEAR_FIELDS,
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
  UPDATE_SYNC_WARNINGS
} from './actionTypes'
import type { FieldType } from './types.js.flow'
import type {
  ArrayInsertAction,
  ArrayInsert,
  ArrayMoveAction,
  ArrayMove,
  ArrayPopAction,
  ArrayPop,
  ArrayPushAction,
  ArrayPush,
  ArrayRemoveAction,
  ArrayRemove,
  ArrayRemoveAllAction,
  ArrayRemoveAll,
  ArrayShiftAction,
  ArrayShift,
  ArraySpliceAction,
  ArraySplice,
  ArraySwapAction,
  ArraySwap,
  ArrayUnshiftAction,
  ArrayUnshift,
  AutofillAction,
  Autofill,
  BlurAction,
  Blur,
  ChangeAction,
  Change,
  ClearSubmitAction,
  ClearSubmit,
  ClearSubmitErrorsAction,
  ClearSubmitErrors,
  ClearAsyncErrorAction,
  ClearAsyncError,
  ClearFieldsAction,
  ClearFields,
  DestroyAction,
  Destroy,
  FocusAction,
  Focus,
  InitializeAction,
  Initialize,
  RegisterFieldAction,
  RegisterField,
  ResetAction,
  Reset,
  ResetSectionAction,
  ResetSection,
  StartAsyncValidationAction,
  StartAsyncValidation,
  StartSubmitAction,
  StartSubmit,
  StopAsyncValidationAction,
  StopAsyncValidation,
  StopSubmitAction,
  StopSubmit,
  SubmitAction,
  Submit,
  SetSubmitFailedAction,
  SetSubmitFailed,
  SetSubmitSucceededAction,
  SetSubmitSucceeded,
  TouchAction,
  Touch,
  UnregisterFieldAction,
  UnregisterField,
  UntouchAction,
  Untouch,
  UpdateSyncErrorsAction,
  UpdateSyncErrors,
  UpdateSyncWarningsAction,
  UpdateSyncWarnings
} from './actions.types'

const arrayInsert: ArrayInsert = (
  form: string,
  field: string,
  index: number,
  value: any
): ArrayInsertAction => ({
  type: ARRAY_INSERT,
  meta: { form, field, index },
  payload: value
})

const arrayMove: ArrayMove = (
  form: string,
  field: string,
  from: number,
  to: number
): ArrayMoveAction => ({
  type: ARRAY_MOVE,
  meta: { form, field, from, to }
})

const arrayPop: ArrayPop = (form: string, field: string): ArrayPopAction => ({
  type: ARRAY_POP,
  meta: { form, field }
})

const arrayPush: ArrayPush = (
  form: string,
  field: string,
  value: any
): ArrayPushAction => ({
  type: ARRAY_PUSH,
  meta: { form, field },
  payload: value
})

const arrayRemove: ArrayRemove = (
  form: string,
  field: string,
  index: number
): ArrayRemoveAction => ({
  type: ARRAY_REMOVE,
  meta: { form, field, index }
})

const arrayRemoveAll: ArrayRemoveAll = (
  form: string,
  field: string
): ArrayRemoveAllAction => ({
  type: ARRAY_REMOVE_ALL,
  meta: { form, field }
})

const arrayShift: ArrayShift = (
  form: string,
  field: string
): ArrayShiftAction => ({
  type: ARRAY_SHIFT,
  meta: { form, field }
})

const arraySplice: ArraySplice = (
  form: string,
  field: string,
  index: number,
  removeNum: number,
  ...value: any
): ArraySpliceAction => {
  const action: ArraySpliceAction = {
    type: ARRAY_SPLICE,
    meta: { form, field, index, removeNum }
  }
  if (Array.isArray(value) && value.length > 0) {
    action.payload = value
  }
  return action
}

const arraySwap: ArraySwap = (
  form: string,
  field: string,
  indexA: number,
  indexB: number
): ArraySwapAction => {
  if (indexA === indexB) {
    throw new Error('Swap indices cannot be equal')
  }
  if (indexA < 0 || indexB < 0) {
    throw new Error('Swap indices cannot be negative')
  }
  return { type: ARRAY_SWAP, meta: { form, field, indexA, indexB } }
}

const arrayUnshift: ArrayUnshift = (
  form: string,
  field: string,
  ...value: any
): ArrayUnshiftAction => {
  const action: ArrayUnshiftAction = {
    type: ARRAY_UNSHIFT,
    meta: { form, field }
  }
  if (Array.isArray(value) && value.length > 0) {
    action.payload = value
  }
  return action
}

const autofill: Autofill = (
  form: string,
  field: string,
  value: any
): AutofillAction => ({
  type: AUTOFILL,
  meta: { form, field },
  payload: value
})

const blur: Blur = (
  form: string,
  field: string,
  value: any,
  touch: boolean
): BlurAction => ({
  type: BLUR,
  meta: { form, field, touch },
  payload: value
})

const change: Change = (
  form: string,
  field: string,
  value: any,
  touch?: boolean,
  persistentSubmitErrors?: boolean
): ChangeAction => ({
  type: CHANGE,
  meta: { form, field, touch, persistentSubmitErrors },
  payload: value
})

const clearSubmit: ClearSubmit = (form: string): ClearSubmitAction => ({
  type: CLEAR_SUBMIT,
  meta: { form }
})

const clearSubmitErrors: ClearSubmitErrors = (
  form: string
): ClearSubmitErrorsAction => ({
  type: CLEAR_SUBMIT_ERRORS,
  meta: { form }
})

const clearAsyncError: ClearAsyncError = (
  form: string,
  field: string
): ClearAsyncErrorAction => ({
  type: CLEAR_ASYNC_ERROR,
  meta: { form, field }
})

const clearFields: ClearFields = (
  form: string,
  keepTouched: boolean,
  persistentSubmitErrors: boolean,
  ...fields: string[]
): ClearFieldsAction => ({
  type: CLEAR_FIELDS,
  meta: { form, keepTouched, persistentSubmitErrors, fields }
})

const destroy: Destroy = (...form: string[]): DestroyAction => ({
  type: DESTROY,
  meta: { form }
})

const focus: Focus = (form: string, field: string): FocusAction => ({
  type: FOCUS,
  meta: { form, field }
})

const initialize: Initialize = (
  form: string,
  values: Object,
  keepDirty?: boolean | Object,
  otherMeta: Object = {}
): InitializeAction => {
  if (keepDirty instanceof Object) {
    otherMeta = keepDirty
    keepDirty = false
  }
  return {
    type: INITIALIZE,
    meta: { form, keepDirty, ...otherMeta },
    payload: values
  }
}

const registerField: RegisterField = (
  form: string,
  name: string,
  type: FieldType
): RegisterFieldAction => ({
  type: REGISTER_FIELD,
  meta: { form },
  payload: { name, type }
})

const reset: Reset = (form: string): ResetAction => ({
  type: RESET,
  meta: { form }
})

const resetSection: ResetSection = (
  form: string,
  ...sections: string[]
): ResetSectionAction => ({
  type: RESET_SECTION,
  meta: { form, sections }
})

const startAsyncValidation: StartAsyncValidation = (
  form: string,
  field: string
): StartAsyncValidationAction => ({
  type: START_ASYNC_VALIDATION,
  meta: { form, field }
})

const startSubmit: StartSubmit = (form: string): StartSubmitAction => ({
  type: START_SUBMIT,
  meta: { form }
})

const stopAsyncValidation: StopAsyncValidation = (
  form: string,
  errors: ?Object
): StopAsyncValidationAction => ({
  type: STOP_ASYNC_VALIDATION,
  meta: { form },
  payload: errors,
  error: !!(errors && Object.keys(errors).length)
})

const stopSubmit: StopSubmit = (
  form: string,
  errors: ?Object
): StopSubmitAction => ({
  type: STOP_SUBMIT,
  meta: { form },
  payload: errors,
  error: !!(errors && Object.keys(errors).length)
})

const submit: Submit = (form: string): SubmitAction => ({
  type: SUBMIT,
  meta: { form }
})

const setSubmitFailed: SetSubmitFailed = (
  form: string,
  ...fields: string[]
): SetSubmitFailedAction => ({
  type: SET_SUBMIT_FAILED,
  meta: { form, fields },
  error: true
})

const setSubmitSucceeded: SetSubmitSucceeded = (
  form: string,
  ...fields: string[]
): SetSubmitSucceededAction => ({
  type: SET_SUBMIT_SUCCEEDED,
  meta: { form, fields },
  error: false
})

const touch: Touch = (form: string, ...fields: string[]): TouchAction => ({
  type: TOUCH,
  meta: { form, fields }
})

const unregisterField: UnregisterField = (
  form: string,
  name: string,
  destroyOnUnmount: boolean = true
): UnregisterFieldAction => ({
  type: UNREGISTER_FIELD,
  meta: { form },
  payload: { name, destroyOnUnmount }
})

const untouch: Untouch = (
  form: string,
  ...fields: string[]
): UntouchAction => ({
  type: UNTOUCH,
  meta: { form, fields }
})

const updateSyncErrors: UpdateSyncErrors = (
  form: string,
  syncErrors: Object = {},
  error: any
): UpdateSyncErrorsAction => ({
  type: UPDATE_SYNC_ERRORS,
  meta: { form },
  payload: { syncErrors, error }
})

const updateSyncWarnings: UpdateSyncWarnings = (
  form: string,
  syncWarnings: Object = {},
  warning: any
): UpdateSyncWarningsAction => ({
  type: UPDATE_SYNC_WARNINGS,
  meta: { form },
  payload: { syncWarnings, warning }
})

const actions = {
  arrayInsert,
  arrayMove,
  arrayPop,
  arrayPush,
  arrayRemove,
  arrayRemoveAll,
  arrayShift,
  arraySplice,
  arraySwap,
  arrayUnshift,
  autofill,
  blur,
  change,
  clearFields,
  clearSubmit,
  clearSubmitErrors,
  clearAsyncError,
  destroy,
  focus,
  initialize,
  registerField,
  reset,
  resetSection,
  startAsyncValidation,
  startSubmit,
  stopAsyncValidation,
  stopSubmit,
  submit,
  setSubmitFailed,
  setSubmitSucceeded,
  touch,
  unregisterField,
  untouch,
  updateSyncErrors,
  updateSyncWarnings
}

export default actions
