// @flow
import { Component, createElement } from 'react'
import { polyfill } from 'react-lifecycles-compat'
import PropTypes from 'prop-types'
import invariant from 'invariant'
import get from 'lodash/get'
import createConnectedFields from './ConnectedFields'
import shallowCompare from './util/shallowCompare'
import plain from './structure/plain'
import prefixName from './util/prefixName'
import type { Structure, ReactContext } from './types'
import type { Props, WarnAndValidateProp } from './FieldsProps.types'

const validateNameProp = prop => {
  if (!prop) {
    return new Error('No "names" prop was specified <Fields/>')
  }
  if (!Array.isArray(prop) && !prop._isFieldArray) {
    return new Error(
      'Invalid prop "names" supplied to <Fields/>. Must be either an array of strings or the fields array generated by FieldArray.'
    )
  }
}

const warnAndValidatePropType = PropTypes.oneOfType([
  PropTypes.func,
  PropTypes.arrayOf(PropTypes.func),
  PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.func, PropTypes.arrayOf(PropTypes.func)])
  )
])
const fieldsPropTypes = {
  component: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.string,
    PropTypes.node
  ]).isRequired,
  format: PropTypes.func,
  parse: PropTypes.func,
  props: PropTypes.object,
  validate: warnAndValidatePropType,
  warn: warnAndValidatePropType,
  withRef: PropTypes.bool
}

const getFieldWarnAndValidate = (prop?: WarnAndValidateProp, name) =>
  Array.isArray(prop) || typeof prop === 'function'
    ? prop
    : get(prop, name, undefined)

const createFields = (structure: Structure<*, *>) => {
  const ConnectedFields = createConnectedFields(structure)

  class Fields extends Component<Props> {
    constructor(props: Props, context: ReactContext) {
      super((props: Props), (context: ReactContext))
      if (!context._reduxForm) {
        throw new Error(
          'Fields must be inside a component decorated with reduxForm()'
        )
      }
      const error = validateNameProp(props.names)
      if (error) {
        throw error
      }
    }

    shouldComponentUpdate(nextProps: Props) {
      return shallowCompare(this, nextProps)
    }

    componentDidMount() {
      this.registerFields(this.props.names)
    }

    componentWillReceiveProps(nextProps: Props) {
      if (!plain.deepEqual(this.props.names, nextProps.names)) {
        const { context } = this
        const { unregister } = context._reduxForm
        // unregister old name
        this.props.names.forEach(name => unregister(prefixName(context, name)))
        // register new name
        this.registerFields(nextProps.names)
      }
    }

    componentWillUnmount() {
      const { context } = this
      const { unregister } = context._reduxForm
      this.props.names.forEach(name => unregister(prefixName(context, name)))
    }

    registerFields(names: string[]) {
      const { context } = this
      const {
        _reduxForm: { register }
      } = context
      names.forEach(name =>
        register(
          prefixName(context, name),
          'Field',
          () => getFieldWarnAndValidate(this.props.validate, name),
          () => getFieldWarnAndValidate(this.props.warn, name)
        )
      )
    }

    getRenderedComponent() {
      invariant(
        this.props.withRef,
        'If you want to access getRenderedComponent(), ' +
          'you must specify a withRef prop to Fields'
      )
      return this.refs.connected.getWrappedInstance().getRenderedComponent()
    }

    get names(): string[] {
      const { context } = this
      return this.props.names.map(name => prefixName(context, name))
    }

    get dirty(): boolean {
      return this.refs.connected.getWrappedInstance().isDirty()
    }

    get pristine(): boolean {
      return !this.dirty
    }

    get values(): Object {
      return (
        this.refs.connected &&
        this.refs.connected.getWrappedInstance().getValues()
      )
    }

    render() {
      const { context } = this
      return createElement(ConnectedFields, {
        ...this.props,
        names: this.props.names.map(name => prefixName(context, name)),
        _reduxForm: this.context._reduxForm,
        ref: 'connected'
      })
    }
  }

  Fields.propTypes = {
    names: (props, propName) => validateNameProp(props[propName]),
    ...fieldsPropTypes
  }
  Fields.contextTypes = {
    _reduxForm: PropTypes.object
  }

  polyfill(Fields)
  return Fields
}

export default createFields
