// @flow
import hoistStatics from 'hoist-non-react-statics'
import invariant from 'invariant'
import isPromise from 'is-promise'
import { mapValues, merge } from 'lodash'
import PropTypes from 'prop-types'
import React, { createElement } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import importedActions from './actions'
import asyncValidation from './asyncValidation'
import defaultShouldAsyncValidate from './defaultShouldAsyncValidate'
import defaultShouldValidate from './defaultShouldValidate'
import defaultShouldError from './defaultShouldError'
import defaultShouldWarn from './defaultShouldWarn'
import silenceEvent from './events/silenceEvent'
import silenceEvents from './events/silenceEvents'
import generateValidator from './generateValidator'
import handleSubmit from './handleSubmit'
import createIsValid from './selectors/isValid'
import plain from './structure/plain'
import getDisplayName from './util/getDisplayName'
import isHotReloading from './util/isHotReloading'
import { withReduxForm, ReduxFormContext } from './ReduxFormContext'
import type { ComponentType, Node, ElementRef } from 'react'
import type { Dispatch } from 'redux'
import type { ReactContext, GetFormState, FieldType, Structure, Values } from './types'
import type { Params as ShouldAsyncValidateParams } from './defaultShouldAsyncValidate'
import type { Params as ShouldValidateParams } from './defaultShouldValidate'
import type { Params as ShouldErrorParams } from './defaultShouldError'
import type { Params as ShouldWarnParams } from './defaultShouldWarn'

const isClassComponent = (Component: ?any) =>
  Boolean(
    Component && Component.prototype && typeof Component.prototype.isReactComponent === 'object'
  )

// extract field-specific actions
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
  focus,
  ...formActions
} = importedActions

const arrayActions = {
  arrayInsert,
  arrayMove,
  arrayPop,
  arrayPush,
  arrayRemove,
  arrayRemoveAll,
  arrayShift,
  arraySplice,
  arraySwap,
  arrayUnshift
}

const propsToNotUpdateFor = [
  ...Object.keys(importedActions),
  'array',
  'asyncErrors',
  'initialValues',
  'syncErrors',
  'syncWarnings',
  'values',
  'registeredFields'
]

const checkSubmit = submit => {
  if (!submit || typeof submit !== 'function') {
    throw new Error(
      'You must either pass handleSubmit() an onSubmit function or pass onSubmit as a prop'
    )
  }
  return submit
}

type OnSubmitFail = (
  errors: ?Object,
  dispatch: Dispatch<any>,
  submitError: ?any,
  props: Object
) => void
type OnSubmitSuccess = (result: ?any, dispatch: Dispatch<any>, props: Object) => void
type InitializeAction = (initialValues: ?Values, keepDirty: boolean, otherMeta: ?Object) => void
type FocusAction = (field: string) => void
type ChangeAction = (field: string, value: any) => void
type BlurAction = (field: string, value: any) => void
type ArrayUnshiftAction = (field: string, value: any) => void
type ArrayShiftAction = (field: string) => void
type ArraySpliceAction = (field: string, index: number, removeNum: number, value: any) => void
type ArrayInsertAction = (field: string, index: number, value: any) => void
type ArrayMoveAction = (field: string, from: number, to: number) => void
type ArrayPopAction = (field: string) => void
type ArrayPushAction = (field: string, value: any) => void
type ArrayRemoveAction = (field: string, index: number) => void
type ArrayRemoveAllAction = (field: string) => void
type ArraySwapAction = (field: string, indexA: number, indexB: number) => void
type ClearSubmitAction = () => void
type DestroyAction = () => void
type RegisterFieldAction = (name: string, type: FieldType) => void
type UnregisterFieldAction = (name: string, destroyOnUnmount: ?boolean) => void
type ResetAction = () => void
type ResetSectionAction = () => void
type SetSubmitFailedAction = (...fields: string[]) => void
type SetSubmitSucceededAction = (...fields: string[]) => void
type StartAsyncValidationAction = (field: string) => void
type StopAsyncValidationAction = (errors: ?Object) => void
type StopSubmitAction = (errors: ?Object) => void
type StartSubmitAction = () => void
type TouchAction = (...fields: string[]) => void
type UntouchAction = (...fields: string[]) => void
type UpdateSyncErrorsAction = (syncErrors: ?Object, error: ?any) => void
type UpdateSyncWarningsAction = (syncErrors: ?Object, error: ?any) => void
type OnSubmitFunction = (
  values: Values,
  dispatch: Dispatch<any>,
  props: Object
) => Promise<any> | void
type AsyncValidateFunction = (
  values: Values,
  dispatch: Dispatch<any>,
  props: Object,
  blurredField: ?string
) => Promise<void>
type ValidateFunction = (values: Values, props: Object) => Object
type ShouldAsyncValidateFunction = (params: ShouldAsyncValidateParams) => boolean
type ShouldValidateFunction = (params: ShouldValidateParams) => boolean
type ShouldErrorFunction = (params: ShouldErrorParams) => boolean
type ShouldWarnFunction = (params: ShouldWarnParams) => boolean
type OnChangeFunction = (
  values: Values,
  dispatch: Dispatch<any>,
  props: Object,
  previousValues: Values
) => void

type RequiredConfig = {
  form: string
}

type DefaultedConfig = {
  destroyOnUnmount: boolean,
  enableReinitialize: boolean,
  getFormState: GetFormState,
  forceUnregisterOnUnmount: boolean,
  keepDirtyOnReinitialize: boolean,
  persistentSubmitErrors: boolean,
  pure: boolean,
  shouldAsyncValidate: ShouldAsyncValidateFunction,
  shouldValidate: ShouldValidateFunction,
  shouldError: ShouldErrorFunction,
  shouldWarn: ShouldWarnFunction,
  submitAsSideEffect: boolean,
  touchOnBlur: boolean,
  touchOnChange: boolean,
  updateUnregisteredFields: boolean
}

type OptionalConfig = {
  asyncBlurFields?: string[],
  asyncChangeFields?: string[],
  asyncValidate?: AsyncValidateFunction,
  keepValues?: boolean,
  immutableProps?: string[],
  initialValues?: Values,
  onChange?: OnChangeFunction,
  onSubmit?: OnSubmitFunction,
  onSubmitFail?: OnSubmitFail,
  onSubmitSuccess?: OnSubmitSuccess,
  propNamespace?: string,
  validate?: ValidateFunction,
  warn?: ValidateFunction
}

// the options that users pass in to the @reduxForm decorator, or other decorators created with createReduxForm()
export type Config = RequiredConfig & $Shape<DefaultedConfig> & OptionalConfig

// props passed in to the internal ReduxForm React component; all the values in Config, with defaults filled in, plus
// all redux-derived values and action creators
export type Props = RequiredConfig &
  DefaultedConfig &
  OptionalConfig & {
    array: Object,
    anyTouched: boolean,
    arrayInsert: ArrayInsertAction,
    arrayMove: ArrayMoveAction,
    arrayPop: ArrayPopAction,
    arrayPush: ArrayPushAction,
    arrayRemove: ArrayRemoveAction,
    arrayRemoveAll: ArrayRemoveAllAction,
    arrayShift: ArrayShiftAction,
    arraySplice: ArraySpliceAction,
    arraySwap: ArraySwapAction,
    arrayUnshift: ArrayUnshiftAction,
    asyncChangeFields?: string[],
    asyncErrors?: any,
    asyncValidating: boolean,
    blur: BlurAction,
    change: ChangeAction,
    children: Node,
    clearSubmit: ClearSubmitAction,
    destroy: DestroyAction,
    dirty: boolean,
    dispatch: Dispatch<any>,
    error?: any,
    focus: FocusAction,
    getFormState: GetFormState,
    initialize: InitializeAction,
    initialized: boolean,
    invalid: boolean,
    updateUnregisteredFields: boolean,
    onChange?: OnChangeFunction,
    onSubmit?: OnSubmitFunction,
    onSubmitFail?: OnSubmitFail,
    onSubmitSuccess?: OnSubmitSuccess,
    pristine: boolean,
    propNamespace?: string,
    pure?: boolean,
    registeredFields: Array<{ name: string, type: FieldType, count: number }>,
    registerField: RegisterFieldAction,
    reset: ResetAction,
    resetSection: ResetSectionAction,
    setSubmitFailed: SetSubmitFailedAction,
    setSubmitSucceeded: SetSubmitSucceededAction,
    shouldAsyncValidate: ShouldAsyncValidateFunction,
    shouldValidate: ShouldValidateFunction,
    startAsyncValidation: StartAsyncValidationAction,
    startSubmit: StartSubmitAction,
    stopAsyncValidation: StopAsyncValidationAction,
    stopSubmit: StopSubmitAction,
    submitAsSideEffect: boolean,
    submitting: boolean,
    submitFailed: boolean,
    submitSucceeded: boolean,
    touch: TouchAction,
    touchOnBlur: boolean,
    touchOnChange: boolean,
    triggerSubmit?: boolean,
    persistentSubmitErrors: boolean,
    syncErrors?: Object,
    syncWarnings?: Object,
    unregisterField: UnregisterFieldAction,
    untouch: UntouchAction,
    updateSyncErrors: UpdateSyncErrorsAction,
    updateSyncWarnings: UpdateSyncWarningsAction,
    valid: boolean,
    validate: ValidateFunction,
    validExceptSubmit: boolean,
    values: Values,
    warn: ValidateFunction,
    warning: any
  }

type PropsWithContext = { _reduxForm?: ReactContext } & Props

/**
 * The decorator that is the main API to redux-form
 */
export default function createReduxForm(structure: Structure<any, any>) {
  const { deepEqual, empty, getIn, setIn, keys, fromJS, toJS } = structure
  const isValid = createIsValid(structure)
  return (initialConfig: Config) => {
    const config = {
      touchOnBlur: true,
      touchOnChange: false,
      persistentSubmitErrors: false,
      destroyOnUnmount: true,
      shouldAsyncValidate: defaultShouldAsyncValidate,
      shouldValidate: defaultShouldValidate,
      shouldError: defaultShouldError,
      shouldWarn: defaultShouldWarn,
      enableReinitialize: false,
      keepDirtyOnReinitialize: false,
      updateUnregisteredFields: false,
      getFormState: state => getIn(state, 'form'),
      pure: true,
      forceUnregisterOnUnmount: false,
      submitAsSideEffect: false,
      ...initialConfig
    }

    return (WrappedComponent: ComponentType<any>) => {
      class Form extends React.Component<PropsWithContext> {
        static WrappedComponent: ComponentType<any>

        wrapped: ElementRef<any> = React.createRef()

        destroyed = false
        fieldCounts = {}
        fieldValidators = {}
        lastFieldValidatorKeys = []
        fieldWarners = {}
        lastFieldWarnerKeys = []
        innerOnSubmit = undefined
        submitPromise = undefined
        initializedOnLoad = false

        constructor(...args) {
          super(...args)
          if (!isHotReloading()) {
            this.initializedOnLoad = this.initIfNeeded()
          }
          invariant(
            this.props.shouldValidate,
            'shouldValidate() is deprecated and will be removed in v9.0.0. Use shouldWarn() or shouldError() instead.'
          )
        }

        initIfNeeded = (nextProps: ?PropsWithContext): boolean => {
          const { enableReinitialize } = this.props
          if (nextProps) {
            if (
              (enableReinitialize || !nextProps.initialized) &&
              !deepEqual(this.props.initialValues, nextProps.initialValues)
            ) {
              const keepDirty = nextProps.initialized && this.props.keepDirtyOnReinitialize
              this.props.initialize(nextProps.initialValues, keepDirty, {
                keepValues: nextProps.keepValues,
                lastInitialValues: this.props.initialValues,
                updateUnregisteredFields: nextProps.updateUnregisteredFields
              })
              return true
            }
          } else if (this.props.initialValues && (!this.props.initialized || enableReinitialize)) {
            this.props.initialize(this.props.initialValues, this.props.keepDirtyOnReinitialize, {
              keepValues: this.props.keepValues,
              updateUnregisteredFields: this.props.updateUnregisteredFields
            })
            return true
          }
          return false
        }

        updateSyncErrorsIfNeeded = (
          nextSyncErrors: ?Object,
          nextError: ?any,
          lastSyncErrors: ?Object
        ): void => {
          const { error, updateSyncErrors } = this.props
          const noErrors = (!lastSyncErrors || !Object.keys(lastSyncErrors).length) && !error
          const nextNoErrors =
            (!nextSyncErrors || !Object.keys(nextSyncErrors).length) && !nextError
          if (
            !(noErrors && nextNoErrors) &&
            (!plain.deepEqual(lastSyncErrors, nextSyncErrors) || !plain.deepEqual(error, nextError))
          ) {
            updateSyncErrors(nextSyncErrors, nextError)
          }
        }

        clearSubmitPromiseIfNeeded = (nextProps: PropsWithContext): void => {
          const { submitting } = this.props
          if (this.submitPromise && submitting && !nextProps.submitting) {
            delete this.submitPromise
          }
        }

        submitIfNeeded = (nextProps: PropsWithContext): void => {
          const { clearSubmit, triggerSubmit } = this.props
          if (!triggerSubmit && nextProps.triggerSubmit) {
            clearSubmit()
            this.submit()
          }
        }

        shouldErrorFunction = (): ShouldValidateFunction | ShouldErrorFunction => {
          const { shouldValidate, shouldError } = this.props
          const shouldValidateOverridden = shouldValidate !== defaultShouldValidate
          const shouldErrorOverridden = shouldError !== defaultShouldError

          return shouldValidateOverridden && !shouldErrorOverridden ? shouldValidate : shouldError
        }

        validateIfNeeded = (nextProps: ?PropsWithContext): void => {
          const { validate, values } = this.props
          const shouldError = this.shouldErrorFunction()
          const fieldLevelValidate = this.generateValidator()
          if (validate || fieldLevelValidate) {
            const initialRender = nextProps === undefined
            const fieldValidatorKeys = Object.keys(this.getValidators())
            const validateParams = {
              values,
              nextProps,
              props: this.props,
              initialRender,
              lastFieldValidatorKeys: this.lastFieldValidatorKeys,
              fieldValidatorKeys,
              structure
            }

            if (shouldError(validateParams)) {
              const propsToValidate = initialRender || !nextProps ? this.props : nextProps
              const { _error, ...nextSyncErrors } = merge(
                validate ? validate(propsToValidate.values, propsToValidate) || {} : {},
                fieldLevelValidate
                  ? fieldLevelValidate(propsToValidate.values, propsToValidate) || {}
                  : {}
              )
              this.lastFieldValidatorKeys = fieldValidatorKeys
              this.updateSyncErrorsIfNeeded(nextSyncErrors, _error, propsToValidate.syncErrors)
            }
          } else {
            this.lastFieldValidatorKeys = []
          }
        }

        updateSyncWarningsIfNeeded = (
          nextSyncWarnings: ?Object,
          nextWarning: any,
          lastSyncWarnings: ?Object
        ): void => {
          const { warning, updateSyncWarnings } = this.props
          const noWarnings =
            (!lastSyncWarnings || !Object.keys(lastSyncWarnings).length) && !warning
          const nextNoWarnings =
            (!nextSyncWarnings || !Object.keys(nextSyncWarnings).length) && !nextWarning
          if (
            !(noWarnings && nextNoWarnings) &&
            (!plain.deepEqual(lastSyncWarnings, nextSyncWarnings) ||
              !plain.deepEqual(warning, nextWarning))
          ) {
            updateSyncWarnings(nextSyncWarnings, nextWarning)
          }
        }

        shouldWarnFunction = (): ShouldValidateFunction | ShouldWarnFunction => {
          const { shouldValidate, shouldWarn } = this.props
          const shouldValidateOverridden = shouldValidate !== defaultShouldValidate
          const shouldWarnOverridden = shouldWarn !== defaultShouldWarn

          return shouldValidateOverridden && !shouldWarnOverridden ? shouldValidate : shouldWarn
        }

        warnIfNeeded = (nextProps: ?PropsWithContext): void => {
          const { warn, values } = this.props
          const shouldWarn = this.shouldWarnFunction()
          const fieldLevelWarn = this.generateWarner()
          if (warn || fieldLevelWarn) {
            const initialRender = nextProps === undefined
            const fieldWarnerKeys = Object.keys(this.getWarners())
            const validateParams = {
              values,
              nextProps,
              props: this.props,
              initialRender,
              lastFieldValidatorKeys: this.lastFieldWarnerKeys,
              fieldValidatorKeys: fieldWarnerKeys,
              structure
            }

            if (shouldWarn(validateParams)) {
              const propsToWarn = initialRender || !nextProps ? this.props : nextProps
              const { _warning, ...nextSyncWarnings } = merge(
                warn ? warn(propsToWarn.values, propsToWarn) : {},
                fieldLevelWarn ? fieldLevelWarn(propsToWarn.values, propsToWarn) : {}
              )
              this.lastFieldWarnerKeys = fieldWarnerKeys
              this.updateSyncWarningsIfNeeded(nextSyncWarnings, _warning, propsToWarn.syncWarnings)
            }
          }
        }

        UNSAFE_componentWillReceiveProps(nextProps: PropsWithContext): void {
          const isValueReset = this.initIfNeeded(nextProps)
          // initialize will dispatch a redux action and call componentWillReceiveProps again; hence we can skip reinitialize if needed.
          if (isValueReset) return
          this.validateIfNeeded(nextProps)
          this.warnIfNeeded(nextProps)
          this.clearSubmitPromiseIfNeeded(nextProps)
          this.submitIfNeeded(nextProps)
          const { onChange, values, dispatch } = nextProps
          if (onChange && !deepEqual(values, this.props.values)) {
            onChange(values, dispatch, nextProps, this.props.values)
          }
        }

        shouldComponentUpdate(nextProps: PropsWithContext): boolean {
          if (!this.props.pure) return true
          const { immutableProps = [] } = config
          // if we have children, we MUST update in React 16
          // https://twitter.com/erikras/status/915866544558788608
          return !!(
            this.props.children ||
            nextProps.children ||
            Object.keys(nextProps).some(prop => {
              // useful to debug rerenders
              // if (!plain.deepEqual(this.props[ prop ], nextProps[ prop ])) {
              //   console.info(prop, 'changed', this.props[ prop ], '==>', nextProps[ prop ])
              // }
              if (~immutableProps.indexOf(prop)) {
                return this.props[prop] !== nextProps[prop]
              }
              return (
                !~propsToNotUpdateFor.indexOf(prop) && !deepEqual(this.props[prop], nextProps[prop])
              )
            })
          )
        }

        componentDidMount(): void {
          if (!isHotReloading()) {
            // initialize in constructor function will dispatch a redux action and call componentWillReceiveProps which checks for validate;
            // hence we can skip validate and warning if initialize has been triggered in constructor
            if (this.initializedOnLoad) return
            this.validateIfNeeded()
            this.warnIfNeeded()
          }
          invariant(
            this.props.shouldValidate,
            'shouldValidate() is deprecated and will be removed in v9.0.0. Use shouldWarn() or shouldError() instead.'
          )
        }

        componentWillUnmount(): void {
          const { destroyOnUnmount, destroy } = this.props
          if (destroyOnUnmount && !isHotReloading()) {
            this.destroyed = true
            destroy()
          }
        }

        getValues = (): Values => this.props.values

        isValid = (): boolean => this.props.valid

        isPristine = (): boolean => this.props.pristine

        register = (
          name: string,
          type: FieldType,
          getValidator: Function,
          getWarner: Function
        ): void => {
          const lastCount = this.fieldCounts[name]
          const nextCount = (lastCount || 0) + 1
          this.fieldCounts[name] = nextCount
          this.props.registerField(name, type)
          if (getValidator) {
            this.fieldValidators[name] = getValidator
          }
          if (getWarner) {
            this.fieldWarners[name] = getWarner
          }
        }

        unregister = (name: string): void => {
          const lastCount = this.fieldCounts[name]
          if (lastCount === 1) delete this.fieldCounts[name]
          else if (lastCount != null) this.fieldCounts[name] = lastCount - 1

          if (!this.destroyed) {
            const { destroyOnUnmount, forceUnregisterOnUnmount, unregisterField } = this.props
            if (destroyOnUnmount || forceUnregisterOnUnmount) {
              unregisterField(name, destroyOnUnmount)
              if (!this.fieldCounts[name]) {
                delete this.fieldValidators[name]
                delete this.fieldWarners[name]
                this.lastFieldValidatorKeys = this.lastFieldValidatorKeys.filter(
                  key => key !== name
                )
              }
            } else {
              unregisterField(name, false)
            }
          }
        }

        getFieldList = (options: Object): string[] => {
          let registeredFields = this.props.registeredFields
          if (!registeredFields) {
            return []
          }
          let keySeq = keys(registeredFields)
          if (options) {
            if (options.excludeFieldArray) {
              keySeq = keySeq.filter(
                name => getIn(registeredFields, `['${name}'].type`) !== 'FieldArray'
              )
            }
            if (options.excludeUnregistered) {
              keySeq = keySeq.filter(name => getIn(registeredFields, `['${name}'].count`) !== 0)
            }
          }
          return toJS(keySeq)
        }

        getValidators = (): Object => {
          const validators = {}
          Object.keys(this.fieldValidators).forEach(name => {
            const validator = this.fieldValidators[name]()
            if (validator) {
              validators[name] = validator
            }
          })
          return validators
        }

        generateValidator = (): Function | void => {
          const validators = this.getValidators()
          return Object.keys(validators).length
            ? generateValidator(validators, structure)
            : undefined
        }

        getWarners = (): Object => {
          const warners = {}
          Object.keys(this.fieldWarners).forEach(name => {
            const warner = this.fieldWarners[name]()
            if (warner) {
              warners[name] = warner
            }
          })
          return warners
        }

        generateWarner = (): Function | void => {
          const warners = this.getWarners()
          return Object.keys(warners).length ? generateValidator(warners, structure) : undefined
        }

        asyncValidate = (
          name: string,
          value: any,
          trigger: 'blur' | 'change'
        ): Promise<void> | void => {
          const {
            asyncBlurFields,
            asyncChangeFields,
            asyncErrors,
            asyncValidate,
            dispatch,
            initialized,
            pristine,
            shouldAsyncValidate,
            startAsyncValidation,
            stopAsyncValidation,
            syncErrors,
            values
          } = this.props
          const submitting = !name

          const fieldNeedsValidation = () => {
            const fieldNeedsValidationForBlur =
              asyncBlurFields && name && ~asyncBlurFields.indexOf(name.replace(/\[[0-9]+]/g, '[]'))
            const fieldNeedsValidationForChange =
              asyncChangeFields &&
              name &&
              ~asyncChangeFields.indexOf(name.replace(/\[[0-9]+]/g, '[]'))
            const asyncValidateByDefault = !(asyncBlurFields || asyncChangeFields)

            return (
              submitting ||
              asyncValidateByDefault ||
              (trigger === 'blur' ? fieldNeedsValidationForBlur : fieldNeedsValidationForChange)
            )
          }

          if (asyncValidate) {
            const valuesToValidate = submitting ? values : setIn(values, name, value)
            const syncValidationPasses = submitting || !getIn(syncErrors, name)
            if (
              fieldNeedsValidation() &&
              shouldAsyncValidate({
                asyncErrors,
                initialized,
                trigger: submitting ? 'submit' : trigger,
                blurredField: name,
                pristine,
                syncValidationPasses
              })
            ) {
              return asyncValidation(
                () => asyncValidate(valuesToValidate, dispatch, this.props, name),
                startAsyncValidation,
                stopAsyncValidation,
                name
              )
            }
          }
        }

        submitCompleted = (result: any): any => {
          delete this.submitPromise
          return result
        }

        submitFailed = (error: any): void => {
          delete this.submitPromise
          throw error
        }

        listenToSubmit = (promise: any): Promise<any> => {
          if (!isPromise(promise)) {
            return promise
          }
          this.submitPromise = promise
          return promise.then(this.submitCompleted, this.submitFailed)
        }

        submit = (submitOrEvent: any): any => {
          const { onSubmit, blur, change, dispatch } = this.props

          if (!submitOrEvent || silenceEvent(submitOrEvent)) {
            // submitOrEvent is an event: fire submit if not already submitting
            if (!this.submitPromise) {
              // avoid recursive stack trace if use Form with onSubmit as handleSubmit
              if (this.innerOnSubmit && this.innerOnSubmit !== this.submit) {
                // will call "submitOrEvent is the submit function" block below
                return this.innerOnSubmit()
              } else {
                return this.listenToSubmit(
                  handleSubmit(
                    checkSubmit(onSubmit),
                    ({
                      ...this.props,
                      ...bindActionCreators({ blur, change }, dispatch)
                    }: any), // TODO: fix type, should be `Props`
                    this.props.validExceptSubmit,
                    this.asyncValidate,
                    this.getFieldList({
                      excludeFieldArray: true,
                      excludeUnregistered: true
                    })
                  )
                )
              }
            }
          } else {
            // submitOrEvent is the submit function: return deferred submit thunk
            return silenceEvents(() => {
              return (
                !this.submitPromise &&
                this.listenToSubmit(
                  handleSubmit(
                    checkSubmit(submitOrEvent),
                    ({
                      ...this.props,
                      ...bindActionCreators({ blur, change }, dispatch)
                    }: any), // TODO: fix type, should be `Props`
                    this.props.validExceptSubmit,
                    this.asyncValidate,
                    this.getFieldList({
                      excludeFieldArray: true,
                      excludeUnregistered: true
                    })
                  )
                )
              )
            })
          }
        }

        reset = (): void => this.props.reset()

        render() {
          // remove some redux-form config-only props
          /* eslint-disable no-unused-vars */
          const {
            anyTouched,
            array,
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
            asyncErrors,
            asyncValidate,
            asyncValidating,
            blur,
            change,
            clearSubmit,
            destroy,
            destroyOnUnmount,
            forceUnregisterOnUnmount,
            dirty,
            dispatch,
            enableReinitialize,
            error,
            focus,
            form,
            getFormState,
            immutableProps,
            initialize,
            initialized,
            initialValues,
            invalid,
            keepDirtyOnReinitialize,
            keepValues,
            updateUnregisteredFields,
            pristine,
            propNamespace,
            registeredFields,
            registerField,
            reset,
            resetSection,
            setSubmitFailed,
            setSubmitSucceeded,
            shouldAsyncValidate,
            shouldValidate,
            shouldError,
            shouldWarn,
            startAsyncValidation,
            startSubmit,
            stopAsyncValidation,
            stopSubmit,
            submitAsSideEffect,
            submitting,
            submitFailed,
            submitSucceeded,
            touch,
            touchOnBlur,
            touchOnChange,
            persistentSubmitErrors,
            syncErrors,
            syncWarnings,
            unregisterField,
            untouch,
            updateSyncErrors,
            updateSyncWarnings,
            valid,
            validExceptSubmit,
            values,
            warning,
            ...rest
          } = this.props
          /* eslint-enable no-unused-vars */
          const reduxFormProps = {
            array,
            anyTouched,
            asyncValidate: this.asyncValidate,
            asyncValidating,
            ...bindActionCreators({ blur, change }, dispatch),
            clearSubmit,
            destroy,
            dirty,
            dispatch,
            error,
            form,
            handleSubmit: this.submit,
            initialize,
            initialized,
            initialValues,
            invalid,
            pristine,
            reset,
            resetSection,
            submitting,
            submitAsSideEffect,
            submitFailed,
            submitSucceeded,

            touch,
            untouch,
            valid,
            warning
          }
          const propsToPass = {
            ...(propNamespace ? { [propNamespace]: reduxFormProps } : reduxFormProps),
            ...rest
          }
          if (isClassComponent(WrappedComponent)) {
            ;((propsToPass: any): Object).ref = this.wrapped
          }
          const _reduxForm = {
            ...this.props,
            getFormState: state => getIn(this.props.getFormState(state), this.props.form),
            asyncValidate: this.asyncValidate,
            getValues: this.getValues,
            sectionPrefix: undefined,
            register: this.register,
            unregister: this.unregister,
            registerInnerOnSubmit: innerOnSubmit => (this.innerOnSubmit = innerOnSubmit)
          }
          return createElement(ReduxFormContext.Provider, {
            value: _reduxForm,
            children: createElement(WrappedComponent, propsToPass)
          })
        }
      }

      Form.displayName = `Form(${getDisplayName(WrappedComponent)})`
      Form.WrappedComponent = WrappedComponent
      Form.propTypes = {
        destroyOnUnmount: PropTypes.bool,
        forceUnregisterOnUnmount: PropTypes.bool,
        form: PropTypes.string.isRequired,
        immutableProps: PropTypes.arrayOf(PropTypes.string),
        initialValues: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
        getFormState: PropTypes.func,
        onSubmitFail: PropTypes.func,
        onSubmitSuccess: PropTypes.func,
        propNamespace: PropTypes.string,
        validate: PropTypes.func,
        warn: PropTypes.func,
        touchOnBlur: PropTypes.bool,
        touchOnChange: PropTypes.bool,
        triggerSubmit: PropTypes.bool,
        persistentSubmitErrors: PropTypes.bool,
        registeredFields: PropTypes.any
      }

      const connector = connect(
        (state, props) => {
          const {
            form,
            getFormState,
            initialValues,
            enableReinitialize,
            keepDirtyOnReinitialize
          } = props
          const formState = getIn(getFormState(state) || empty, form) || empty
          const stateInitial = getIn(formState, 'initial')
          const initialized = !!stateInitial

          const shouldUpdateInitialValues =
            enableReinitialize && initialized && !deepEqual(initialValues, stateInitial)
          const shouldResetValues = shouldUpdateInitialValues && !keepDirtyOnReinitialize

          let initial = initialValues || stateInitial || empty

          if (!shouldUpdateInitialValues) {
            initial = stateInitial || empty
          }

          let values = getIn(formState, 'values') || initial

          if (shouldResetValues) {
            values = initial
          }

          const pristine = shouldResetValues || deepEqual(initial, values)
          const asyncErrors = getIn(formState, 'asyncErrors')
          const syncErrors = getIn(formState, 'syncErrors') || plain.empty
          const syncWarnings = getIn(formState, 'syncWarnings') || plain.empty
          const registeredFields = getIn(formState, 'registeredFields')
          const valid = isValid(form, getFormState, false)(state)
          const validExceptSubmit = isValid(form, getFormState, true)(state)
          const anyTouched = !!getIn(formState, 'anyTouched')
          const submitting = !!getIn(formState, 'submitting')
          const submitFailed = !!getIn(formState, 'submitFailed')
          const submitSucceeded = !!getIn(formState, 'submitSucceeded')
          const error = getIn(formState, 'error')
          const warning = getIn(formState, 'warning')
          const triggerSubmit = getIn(formState, 'triggerSubmit')
          return {
            anyTouched,
            asyncErrors,
            asyncValidating: getIn(formState, 'asyncValidating') || false,
            dirty: !pristine,
            error,
            initialized,
            invalid: !valid,
            pristine,
            registeredFields,
            submitting,
            submitFailed,
            submitSucceeded,
            syncErrors,
            syncWarnings,
            triggerSubmit,
            values,
            valid,
            validExceptSubmit,
            warning
          }
        },
        (dispatch, initialProps) => {
          const bindForm = actionCreator => actionCreator.bind(null, initialProps.form)

          // Bind the first parameter on `props.form`
          const boundFormACs = mapValues(formActions, bindForm)
          const boundArrayACs = mapValues(arrayActions, bindForm)
          const boundBlur = (field, value) =>
            blur(initialProps.form, field, value, !!initialProps.touchOnBlur)
          const boundChange = (field, value) =>
            change(
              initialProps.form,
              field,
              value,
              !!initialProps.touchOnChange,
              !!initialProps.persistentSubmitErrors
            )
          const boundFocus = bindForm(focus)

          // Wrap action creators with `dispatch`
          const connectedFormACs = bindActionCreators(boundFormACs, dispatch)
          const connectedArrayACs = {
            insert: bindActionCreators(boundArrayACs.arrayInsert, dispatch),
            move: bindActionCreators(boundArrayACs.arrayMove, dispatch),
            pop: bindActionCreators(boundArrayACs.arrayPop, dispatch),
            push: bindActionCreators(boundArrayACs.arrayPush, dispatch),
            remove: bindActionCreators(boundArrayACs.arrayRemove, dispatch),
            removeAll: bindActionCreators(boundArrayACs.arrayRemoveAll, dispatch),
            shift: bindActionCreators(boundArrayACs.arrayShift, dispatch),
            splice: bindActionCreators(boundArrayACs.arraySplice, dispatch),
            swap: bindActionCreators(boundArrayACs.arraySwap, dispatch),
            unshift: bindActionCreators(boundArrayACs.arrayUnshift, dispatch)
          }

          return {
            ...connectedFormACs,
            ...boundArrayACs,
            blur: boundBlur,
            change: boundChange,
            array: connectedArrayACs,
            focus: boundFocus,
            dispatch
          }
        },
        undefined,
        { forwardRef: true }
      )
      const ConnectedForm = hoistStatics<any, any, any, any>(connector(Form), WrappedComponent)
      ConnectedForm.defaultProps = config

      // build outer component to expose instance api
      class ReduxForm extends React.Component<Props> {
        ref: ElementRef<any> = React.createRef()

        submit() {
          return this.ref.current && this.ref.current.submit()
        }

        reset(): void {
          if (this.ref) {
            this.ref.current.reset()
          }
        }

        get valid(): boolean {
          return !!(this.ref.current && this.ref.current.isValid())
        }

        get invalid(): boolean {
          return !this.valid
        }

        get pristine(): boolean {
          return !!(this.ref.current && this.ref.current.isPristine())
        }

        get dirty(): boolean {
          return !this.pristine
        }

        get values(): Values {
          return this.ref.current ? this.ref.current.getValues() : empty
        }

        get fieldList(): string[] {
          // mainly provided for testing
          return this.ref.current ? this.ref.current.getFieldList() : []
        }

        get wrappedInstance(): ?HTMLElement {
          // for testing
          return this.ref.current && this.ref.current.wrapped.current
        }

        render() {
          const { initialValues, ...rest } = this.props
          return createElement(ConnectedForm, {
            ...rest,
            ref: this.ref,
            // convert initialValues if need to
            initialValues: fromJS(initialValues)
          })
        }
      }

      const WithContext = hoistStatics<any, any, any, any>(
        withReduxForm(ReduxForm),
        WrappedComponent
      )
      WithContext.defaultProps = config
      return WithContext
    }
  }
}
