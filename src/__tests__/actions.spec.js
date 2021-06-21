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
  BLUR,
  CHANGE,
  CLEAR_SUBMIT,
  CLEAR_SUBMIT_ERRORS,
  CLEAR_FIELDS,
  DESTROY,
  FOCUS,
  INITIALIZE,
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
  UPDATE_SYNC_WARNINGS,
  CLEAR_ASYNC_ERROR
} from '../actionTypes'
import actions from '../actions'
import { isFSA } from 'flux-standard-action'

const {
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
  blur,
  change,
  clearSubmit,
  clearSubmitErrors,
  clearFields,
  destroy,
  focus,
  initialize,
  registerField,
  reset,
  resetSection,
  setSubmitFailed,
  setSubmitSucceeded,
  startAsyncValidation,
  startSubmit,
  stopAsyncValidation,
  stopSubmit,
  submit,
  touch,
  unregisterField,
  untouch,
  updateSyncErrors,
  updateSyncWarnings,
  clearAsyncError
} = actions

describe('actions', () => {
  it('should create array insert action', () => {
    expect(arrayInsert('myForm', 'myField', 0, 'foo')).toEqual({
      type: ARRAY_INSERT,

      meta: {
        form: 'myForm',
        field: 'myField',
        index: 0
      },

      payload: 'foo'
    })

    expect(isFSA(arrayInsert('myForm', 'myField', 0, 'foo'))).toBe(true)
  })

  it('should create array move action', () => {
    expect(arrayMove('myForm', 'myField', 2, 4)).toEqual({
      type: ARRAY_MOVE,

      meta: {
        form: 'myForm',
        field: 'myField',
        from: 2,
        to: 4
      }
    })

    expect(isFSA(arrayMove('myForm', 'myField', 2, 4))).toBe(true)
  })

  it('should create array pop action', () => {
    expect(arrayPop('myForm', 'myField')).toEqual({
      type: ARRAY_POP,

      meta: {
        form: 'myForm',
        field: 'myField'
      }
    })

    expect(isFSA(arrayPop('myForm', 'myField'))).toBe(true)
  })

  it('should create array push action', () => {
    expect(arrayPush('myForm', 'myField', 'foo')).toEqual({
      type: ARRAY_PUSH,

      meta: {
        form: 'myForm',
        field: 'myField'
      },

      payload: 'foo'
    })

    expect(isFSA(arrayPush('myForm', 'myField', 'foo'))).toBe(true)

    expect(arrayPush('myForm', 'myField')).toEqual({
      type: ARRAY_PUSH,

      meta: {
        form: 'myForm',
        field: 'myField'
      },

      payload: undefined
    })

    expect(isFSA(arrayPush('myForm', 'myField'))).toBe(true)
  })

  it('should create array remove action', () => {
    expect(arrayRemove('myForm', 'myField', 3)).toEqual({
      type: ARRAY_REMOVE,

      meta: {
        form: 'myForm',
        field: 'myField',
        index: 3
      }
    })

    expect(isFSA(arrayRemove('myForm', 'myField', 3))).toBe(true)
  })

  it('should create array removeAll action', () => {
    expect(arrayRemoveAll('myForm', 'myField')).toEqual({
      type: ARRAY_REMOVE_ALL,

      meta: {
        form: 'myForm',
        field: 'myField'
      }
    })

    expect(isFSA(arrayRemoveAll('myForm', 'myField'))).toBe(true)
  })

  it('should create array shift action', () => {
    expect(arrayShift('myForm', 'myField')).toEqual({
      type: ARRAY_SHIFT,

      meta: {
        form: 'myForm',
        field: 'myField'
      }
    })

    expect(isFSA(arrayShift('myForm', 'myField'))).toBe(true)
  })

  it('should create array splice action', () => {
    expect(arraySplice('myForm', 'myField', 1, 1)).toEqual({
      type: ARRAY_SPLICE,

      meta: {
        form: 'myForm',
        field: 'myField',
        index: 1,
        removeNum: 1
      }
    })

    expect(isFSA(arraySplice('myForm', 'myField', 1, 1))).toBe(true)

    expect(arraySplice('myForm', 'myField', 2, 1)).toEqual({
      type: ARRAY_SPLICE,

      meta: {
        form: 'myForm',
        field: 'myField',
        index: 2,
        removeNum: 1
      }
    })

    expect(isFSA(arraySplice('myForm', 'myField', 2, 1))).toBe(true)

    expect(arraySplice('myForm', 'myField', 2, 0, 'foo')).toEqual({
      type: ARRAY_SPLICE,

      meta: {
        form: 'myForm',
        field: 'myField',
        index: 2,
        removeNum: 0
      },

      payload: ['foo']
    })

    expect(isFSA(arraySplice('myForm', 'myField', 2, 0, 'foo'))).toBe(true)

    expect(arraySplice('myForm', 'myField', 3, 2, { foo: 'bar' })).toEqual({
      type: ARRAY_SPLICE,

      meta: {
        form: 'myForm',
        field: 'myField',
        index: 3,
        removeNum: 2
      },

      payload: [{ foo: 'bar' }]
    })

    expect(isFSA(arraySplice('myForm', 'myField', 3, 2, { foo: 'bar' }))).toBe(
      true
    )
  })

  it('should create array unshift action', () => {
    expect(arrayUnshift('myForm', 'myField', 'foo')).toEqual({
      type: ARRAY_UNSHIFT,

      meta: {
        form: 'myForm',
        field: 'myField'
      },

      payload: ['foo']
    })

    expect(isFSA(arrayUnshift('myForm', 'myField', 'foo'))).toBe(true)
  })

  it('should create array swap action', () => {
    expect(arraySwap('myForm', 'myField', 0, 8)).toEqual({
      type: ARRAY_SWAP,

      meta: {
        form: 'myForm',
        field: 'myField',
        indexA: 0,
        indexB: 8
      }
    })

    expect(isFSA(arraySwap('myForm', 'myField', 0, 8))).toBe(true)
  })

  it('should throw an exception with illegal array swap indices', () => {
    expect(() => arraySwap('myForm', 'myField', 2, 2)).toThrow(
      'Swap indices cannot be equal'
    )
    expect(() => arraySwap('myForm', 'myField', -2, 2)).toThrow(
      'Swap indices cannot be negative'
    )
    expect(() => arraySwap('myForm', 'myField', 2, -2)).toThrow(
      'Swap indices cannot be negative'
    )
  })

  it('should create blur action', () => {
    expect(blur('myForm', 'myField', 'bar', false)).toEqual({
      type: BLUR,

      meta: {
        form: 'myForm',
        field: 'myField',
        touch: false
      },

      payload: 'bar'
    })

    expect(isFSA(blur('myForm', 'myField', 'bar', false))).toBe(true)

    expect(blur('myForm', 'myField', 7, true)).toEqual({
      type: BLUR,

      meta: {
        form: 'myForm',
        field: 'myField',
        touch: true
      },

      payload: 7
    })

    expect(isFSA(blur('myForm', 'myField', 7, true))).toBe(true)
  })

  it('should create change action', () => {
    expect(change('myForm', 'myField', 'bar', false, true)).toEqual({
      type: CHANGE,

      meta: {
        form: 'myForm',
        field: 'myField',
        touch: false,
        persistentSubmitErrors: true
      },

      payload: 'bar'
    })

    expect(isFSA(change('myForm', 'myField', 'bar', false, true))).toBe(true)

    expect(change('myForm', 'myField', 7, true, false)).toEqual({
      type: CHANGE,

      meta: {
        form: 'myForm',
        field: 'myField',
        touch: true,
        persistentSubmitErrors: false
      },

      payload: 7
    })

    expect(isFSA(change('myForm', 'myField', 7, true, false))).toBe(true)
  })

  it('should create focus action', () => {
    expect(focus('myForm', 'myField')).toEqual({
      type: FOCUS,

      meta: {
        form: 'myForm',
        field: 'myField'
      }
    })

    expect(isFSA(focus('myForm', 'myField'))).toBe(true)
  })

  it('should create clear submit action', () => {
    expect(clearSubmit('myForm')).toEqual({
      type: CLEAR_SUBMIT,

      meta: {
        form: 'myForm'
      }
    })

    expect(isFSA(clearSubmit('myForm'))).toBe(true)
  })

  it('should create clear submit errors action', () => {
    expect(clearSubmitErrors('myForm')).toEqual({
      type: CLEAR_SUBMIT_ERRORS,

      meta: {
        form: 'myForm'
      }
    })

    expect(isFSA(clearSubmitErrors('myForm'))).toBe(true)
  })

  it('should create clear fields action', () => {
    expect(clearFields('myForm', true, true, 'a', 'b')).toEqual({
      type: CLEAR_FIELDS,

      meta: {
        form: 'myForm',
        keepTouched: true,
        persistentSubmitErrors: true,
        fields: ['a', 'b']
      }
    })

    expect(isFSA(clearSubmitErrors('myForm'))).toBe(true)
  })

  it('should create initialize action', () => {
    const data = { a: 8, c: 9 }

    expect(initialize('myForm', data)).toEqual({
      type: INITIALIZE,

      meta: {
        form: 'myForm',
        keepDirty: undefined
      },

      payload: data
    })

    expect(isFSA(initialize('myForm', data))).toBe(true)
  })

  it('should create initialize action with a keepDirty value', () => {
    const data = { a: 8, c: 9 }

    expect(initialize('myForm', data, true)).toEqual({
      type: INITIALIZE,

      meta: {
        form: 'myForm',
        keepDirty: true
      },

      payload: data
    })

    expect(isFSA(initialize('myForm', data, true))).toBe(true)
  })

  it('should create registerField action', () => {
    expect(registerField('myForm', 'foo', 'Field')).toEqual({
      type: REGISTER_FIELD,

      meta: {
        form: 'myForm'
      },

      payload: {
        name: 'foo',
        type: 'Field'
      }
    })

    expect(isFSA(registerField('myForm', 'foo', 'Field'))).toBe(true)
  })

  it('should create reset action', () => {
    expect(reset('myForm')).toEqual({
      type: RESET,

      meta: {
        form: 'myForm'
      }
    })

    expect(isFSA(reset('myForm'))).toBe(true)
  })

  it('should create resetSection action', () => {
    expect(resetSection('myForm', 'mySection')).toEqual({
      type: RESET_SECTION,

      meta: {
        form: 'myForm',
        sections: ['mySection']
      }
    })

    expect(isFSA(resetSection('myForm', 'mySection'))).toBe(true)
  })

  it('should create destroy action', () => {
    expect(destroy('myForm')).toEqual({
      type: DESTROY,

      meta: {
        form: ['myForm']
      }
    })

    expect(isFSA(destroy('myForm'))).toBe(true)

    expect(destroy('myForm1', 'myForm2')).toEqual({
      type: DESTROY,

      meta: {
        form: ['myForm1', 'myForm2']
      }
    })

    expect(isFSA(destroy('myForm1', 'myForm2'))).toBe(true)
  })

  it('should create startAsyncValidation action', () => {
    expect(startAsyncValidation('myForm', 'myField')).toEqual({
      type: START_ASYNC_VALIDATION,

      meta: {
        form: 'myForm',
        field: 'myField'
      }
    })

    expect(isFSA(startAsyncValidation('myForm', 'myField'))).toBe(true)
  })

  it('should create startSubmit action', () => {
    expect(startSubmit('myForm')).toEqual({
      type: START_SUBMIT,

      meta: {
        form: 'myForm'
      }
    })

    expect(isFSA(startSubmit('myForm'))).toBe(true)
  })

  it('should create startSubmit action', () => {
    expect(startSubmit('myForm')).toEqual({
      type: START_SUBMIT,

      meta: {
        form: 'myForm'
      }
    })

    expect(isFSA(startSubmit('myForm'))).toBe(true)
  })

  it('should create stopAsyncValidation action', () => {
    const errors = {
      foo: 'Foo error',
      bar: 'Error for bar'
    }

    expect(stopAsyncValidation('myForm', errors)).toEqual({
      type: STOP_ASYNC_VALIDATION,

      meta: {
        form: 'myForm'
      },

      payload: errors,
      error: true
    })

    expect(isFSA(stopAsyncValidation('myForm', errors))).toBe(true)
  })

  it('should create stopSubmit action', () => {
    expect(stopSubmit('myForm')).toEqual({
      type: STOP_SUBMIT,

      meta: {
        form: 'myForm'
      },

      payload: undefined,
      error: false
    })

    expect(isFSA(stopSubmit('myForm'))).toBe(true)
    const errors = {
      foo: 'Foo error',
      bar: 'Error for bar'
    }

    expect(stopSubmit('myForm', errors)).toEqual({
      type: STOP_SUBMIT,

      meta: {
        form: 'myForm'
      },

      payload: errors,
      error: true
    })

    expect(isFSA(stopSubmit('myForm', errors))).toBe(true)
  })

  it('should create submit action', () => {
    expect(submit('myForm')).toEqual({
      type: SUBMIT,

      meta: {
        form: 'myForm'
      }
    })

    expect(isFSA(submit('myForm'))).toBe(true)
  })

  it('should create setSubmitFailed action', () => {
    expect(setSubmitFailed('myForm')).toEqual({
      type: SET_SUBMIT_FAILED,

      meta: {
        form: 'myForm',
        fields: []
      },

      error: true
    })

    expect(isFSA(setSubmitFailed('myForm'))).toBe(true)

    expect(setSubmitFailed('myForm', 'a', 'b', 'c')).toEqual({
      type: SET_SUBMIT_FAILED,

      meta: {
        form: 'myForm',
        fields: ['a', 'b', 'c']
      },

      error: true
    })

    expect(isFSA(setSubmitFailed('myForm', 'a', 'b', 'c'))).toBe(true)
  })

  it('should create setSubmitSucceeded action', () => {
    expect(setSubmitSucceeded('myForm')).toEqual({
      type: SET_SUBMIT_SUCCEEDED,

      meta: {
        form: 'myForm',
        fields: []
      },

      error: false
    })

    expect(isFSA(setSubmitSucceeded('myForm'))).toBe(true)

    expect(setSubmitSucceeded('myForm', 'a', 'b', 'c')).toEqual({
      type: SET_SUBMIT_SUCCEEDED,

      meta: {
        form: 'myForm',
        fields: ['a', 'b', 'c']
      },

      error: false
    })

    expect(isFSA(setSubmitSucceeded('myForm', 'a', 'b', 'c'))).toBe(true)
  })

  it('should create touch action', () => {
    expect(touch('myForm', 'foo', 'bar')).toEqual({
      type: TOUCH,

      meta: {
        form: 'myForm',
        fields: ['foo', 'bar']
      }
    })

    expect(isFSA(touch('myForm', 'foo', 'bar'))).toBe(true)

    expect(touch('myForm', 'cat', 'dog', 'pig')).toEqual({
      type: TOUCH,

      meta: {
        form: 'myForm',
        fields: ['cat', 'dog', 'pig']
      }
    })

    expect(isFSA(touch('myForm', 'cat', 'dog', 'pig'))).toBe(true)
  })

  it('should create unregisterField action', () => {
    expect(unregisterField('myForm', 'foo')).toEqual({
      type: UNREGISTER_FIELD,

      meta: {
        form: 'myForm'
      },

      payload: {
        name: 'foo',
        destroyOnUnmount: true
      }
    })

    expect(isFSA(unregisterField('myForm', 'foo'))).toBe(true)
  })

  it('should create untouch action', () => {
    expect(untouch('myForm', 'foo', 'bar')).toEqual({
      type: UNTOUCH,

      meta: {
        form: 'myForm',
        fields: ['foo', 'bar']
      }
    })

    expect(isFSA(untouch('myForm', 'foo', 'bar'))).toBe(true)

    expect(untouch('myForm', 'cat', 'dog', 'pig')).toEqual({
      type: UNTOUCH,

      meta: {
        form: 'myForm',
        fields: ['cat', 'dog', 'pig']
      }
    })

    expect(isFSA(untouch('myForm', 'cat', 'dog', 'pig'))).toBe(true)
  })

  it('should create updateSyncErrors action', () => {
    expect(updateSyncErrors('myForm', { foo: 'foo error' })).toEqual({
      type: UPDATE_SYNC_ERRORS,

      meta: {
        form: 'myForm'
      },

      payload: {
        error: undefined,

        syncErrors: {
          foo: 'foo error'
        }
      }
    })

    expect(isFSA(updateSyncErrors('myForm', { foo: 'foo error' }))).toBe(true)
  })

  it('should create updateSyncErrors action with no errors if none given', () => {
    expect(updateSyncErrors('myForm')).toEqual({
      type: UPDATE_SYNC_ERRORS,

      meta: {
        form: 'myForm'
      },

      payload: {
        error: undefined,
        syncErrors: {}
      }
    })

    expect(isFSA(updateSyncErrors('myForm'))).toBe(true)
  })

  it('should create updateSyncWarnings action', () => {
    expect(updateSyncWarnings('myForm', { foo: 'foo warning' })).toEqual({
      type: UPDATE_SYNC_WARNINGS,

      meta: {
        form: 'myForm'
      },

      payload: {
        warning: undefined,

        syncWarnings: {
          foo: 'foo warning'
        }
      }
    })

    expect(isFSA(updateSyncWarnings('myForm', { foo: 'foo warning' }))).toBe(
      true
    )
  })

  it('should create updateSyncWarnings action with no warnings if none given', () => {
    expect(updateSyncWarnings('myForm')).toEqual({
      type: UPDATE_SYNC_WARNINGS,

      meta: {
        form: 'myForm'
      },

      payload: {
        warning: undefined,
        syncWarnings: {}
      }
    })

    expect(isFSA(updateSyncWarnings('myForm'))).toBe(true)
  })

  it('should create clearAsyncError action', () => {
    expect(clearAsyncError('myForm', 'foo')).toEqual({
      type: CLEAR_ASYNC_ERROR,

      meta: {
        form: 'myForm',
        field: 'foo'
      }
    })

    expect(isFSA(clearAsyncError('myForm', 'foo'))).toBe(true)
  })
})
