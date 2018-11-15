// @flow
import React, { Component, createElement } from 'react'
import { polyfill } from 'react-lifecycles-compat'
import PropTypes from 'prop-types'
import invariant from 'invariant'
import createConnectedFieldArray from './ConnectedFieldArray'
import prefixName from './util/prefixName'
import plain from './structure/plain'
import type {
  ConnectedComponent,
  Structure,
  ReactContext
} from './types.js.flow'
import type { InstanceApi as ConnectedFieldArrayInstanceApi } from './ConnectedFieldArray.types'
import type { Props } from './FieldArrayProps.types'
import validateComponentProp from './util/validateComponentProp'

const toArray = (value: any): Array<*> =>
  Array.isArray(value) ? value : [value]

const wrapError = (fn: ?Function, key: string): ?Function =>
  fn &&
  ((...args) => {
    const validators = toArray(fn)
    for (let i = 0; i < validators.length; i++) {
      const result = validators[i](...args)
      if (result) {
        return { [key]: result }
      }
    }
  })

const createFieldArray = (structure: Structure<*, *>) => {
  const ConnectedFieldArray = createConnectedFieldArray(structure)

  class FieldArray extends Component<Props> {
    context: ReactContext

    name: string
    ref: ?ConnectedComponent<ConnectedFieldArrayInstanceApi>

    constructor(props: Props, context: ReactContext) {
      super(props, context)
      if (!context._reduxForm) {
        throw new Error(
          'FieldArray must be inside a component decorated with reduxForm()'
        )
      }
    }

    componentDidMount() {
      this.context._reduxForm.register(
        this.name,
        'FieldArray',
        () => wrapError(this.props.validate, '_error'),
        () => wrapError(this.props.warn, '_warning')
      )
    }

    componentWillReceiveProps(nextProps: Props, nextContext: any) {
      const oldName = prefixName(this.context, this.props.name)
      const newName = prefixName(nextContext, nextProps.name)

      if (
        oldName !== newName ||
        // use deepEqual here because they could be a function or an array of functions
        !plain.deepEqual(this.props.validate, nextProps.validate) ||
        !plain.deepEqual(this.props.warn, nextProps.warn)
      ) {
        // unregister old name
        this.context._reduxForm.unregister(oldName)
        // register new name
        this.context._reduxForm.register(
          newName,
          'FieldArray',
          () => wrapError(nextProps.validate, '_error'),
          () => wrapError(nextProps.warn, '_warning')
        )
      }
    }

    componentWillUnmount() {
      this.context._reduxForm.unregister(this.name)
    }

    saveRef = (ref: ?React.Component<*, *>) => {
      this.ref = ((ref: any): ?ConnectedComponent<
        ConnectedFieldArrayInstanceApi
      >)
    }

    get name(): string {
      return prefixName(this.context, this.props.name)
    }

    get dirty(): boolean {
      return !this.ref || this.ref.getWrappedInstance().dirty
    }

    get pristine(): boolean {
      return !!(this.ref && this.ref.getWrappedInstance().pristine)
    }

    get value(): ?(any[]) {
      return this.ref ? this.ref.getWrappedInstance().value : undefined
    }

    getRenderedComponent() {
      invariant(
        this.props.withRef,
        'If you want to access getRenderedComponent(), ' +
          'you must specify a withRef prop to FieldArray'
      )
      return this.ref && this.ref.getWrappedInstance().getRenderedComponent()
    }

    render() {
      return createElement(ConnectedFieldArray, {
        ...this.props,
        name: this.name,
        _reduxForm: this.context._reduxForm,
        ref: this.saveRef
      })
    }
  }

  FieldArray.propTypes = {
    name: PropTypes.string.isRequired,
    component: validateComponentProp,
    props: PropTypes.object,
    validate: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.arrayOf(PropTypes.func)
    ]),
    warn: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.arrayOf(PropTypes.func)
    ]),
    withRef: PropTypes.bool
  }
  FieldArray.contextTypes = {
    _reduxForm: PropTypes.object
  }

  polyfill(FieldArray)
  return FieldArray
}

export default createFieldArray
