// @flow
import type { OptimisticSyntheticDragEvent, OptimisticSyntheticFocusEvent, Structure } from './types'
import type { Dispatch } from 'redux'
import type { FieldProps, InputProps } from './FieldProps.types'

export type Props = {
  asyncError: any,
  asyncValidating: boolean,
  onBlur: {
    (
      event: OptimisticSyntheticFocusEvent,
      newValue: ?any,
      previousValue: ?any,
      name: ?string
    ): void
  },
  onChange: {
    (
      event: SyntheticInputEvent<>,
      newValue: ?any,
      previousValue: ?any,
      name: ?string
    ): void
  },
  onDrop: {
    (
      event: OptimisticSyntheticDragEvent,
      newValue: ?any,
      previousValue: ?any,
      name: ?string
    ): void
  },
  onDragStart: { (event: OptimisticSyntheticDragEvent, name: ?string): void },
  onFocus: { (event: OptimisticSyntheticFocusEvent, name: ?string): void },
  dirty: boolean,
  dispatch: Dispatch<any>,
  form: string,
  format?: { (value: any, name: string): any },
  initial: any,
  parse?: { (value: any, name: string): any },
  normalize?: { (value: any): any },
  pristine: boolean,
  props?: Object,
  state: any,
  submitError?: string,
  submitFailed: boolean,
  submitting: boolean,
  syncError?: any,
  syncWarning?: any,
  type?: string,
  validate?: { (values: any): Object },
  value: any,
  _value: any,
  warn?: { (values: any): Object }
}

const processProps = (
  type: ?string,
  props: InputProps,
  _value: any,
  deepEqual: Function
): Object => {
  const { value } = props
  if (type === 'checkbox') {
    return {
      ...props,
      checked: !!value
    }
  }
  if (type === 'radio') {
    return {
      ...props,
      checked: deepEqual(value, _value),
      value: _value
    }
  }
  if (type === 'select-multiple') {
    return {
      ...props,
      value: value || []
    }
  }
  if (type === 'file') {
    return {
      ...props,
      value: value || undefined
    }
  }
  return props
}

export default function createFieldProps(
  { getIn, toJS, deepEqual }: Structure<any, any>,
  name: string,
  {
    asyncError,
    asyncValidating,
    onBlur,
    onChange,
    onDrop,
    onDragStart,
    dirty,
    dispatch,
    onFocus,
    form,
    format,
    initial,
    parse, // eslint-disable-line no-unused-vars
    pristine,
    props,
    state,
    submitError,
    submitFailed,
    submitting,
    syncError,
    syncWarning,
    validate, // eslint-disable-line no-unused-vars
    value,
    _value,
    warn, // eslint-disable-line no-unused-vars
    ...custom
  }: Props
): FieldProps {
  const error = syncError || asyncError || submitError
  const warning = syncWarning

  const formatFieldValue = (value, format) => {
    if (format === null) {
      return value
    }
    const defaultFormattedValue = value == null ? '' : value
    return format ? format(value, name) : defaultFormattedValue
  }

  const formattedFieldValue = formatFieldValue(value, format)

  return {
    input: processProps(
      custom.type,
      {
        name,
        onBlur,
        onChange,
        onDragStart,
        onDrop,
        onFocus,
        value: formattedFieldValue
      },
      _value,
      deepEqual
    ),
    meta: {
      ...toJS(state),
      active: !!(state && getIn(state, 'active')),
      asyncValidating,
      autofilled: !!(state && getIn(state, 'autofilled')),
      dirty,
      dispatch,
      error,
      form,
      initial,
      warning,
      invalid: !!error,
      pristine,
      submitting: !!submitting,
      submitFailed: !!submitFailed,
      touched: !!(state && getIn(state, 'touched')),
      valid: !error,
      visited: !!(state && getIn(state, 'visited'))
    },
    custom: { ...custom, ...props }
  }
}
