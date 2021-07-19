// @flow
import React, { Component, createElement } from 'react'
import PropTypes from 'prop-types'
import invariant from 'invariant'
import createConnectedFieldArray from './ConnectedFieldArray'
import prefixName from './util/prefixName'
import { withReduxForm } from './ReduxFormContext'
import type { ElementRef } from 'react'
import type { Structure, ReactContext } from './types.js.flow'
import type { Props as PropsWithoutContext } from './FieldArrayProps.types'
import validateComponentProp from './util/validateComponentProp'

type Props = ReactContext & PropsWithoutContext

const toArray = (value: any): Array<any> => (Array.isArray(value) ? value : [value])

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

export default function createFieldArray(structure: Structure<any, any>) {
  const ConnectedFieldArray = createConnectedFieldArray(structure)

  class FieldArray extends Component<Props> {
    name: string
    ref: ElementRef<any> = React.createRef()

    constructor(props: Props) {
      super(props)
      if (!props._reduxForm) {
        throw new Error('FieldArray must be inside a component decorated with reduxForm()')
      }
    }

    componentDidMount() {
      this.props._reduxForm.register(
        this.name,
        'FieldArray',
        () => wrapError(this.props.validate, '_error'),
        () => wrapError(this.props.warn, '_warning')
      )
    }

    componentDidUpdate(prevProps: Props) {
      const oldName = prefixName(prevProps, prevProps.name)
      const newName = prefixName(this.props, this.props.name)

      if (oldName !== newName) {
        // unregister old name
        this.props._reduxForm.unregister(oldName)
        // register new name
        this.props._reduxForm.register(newName, 'FieldArray')
      }
    }

    componentWillUnmount() {
      this.props._reduxForm.unregister(this.name)
    }

    get name(): string {
      return prefixName(this.props, this.props.name)
    }

    get dirty(): boolean {
      return !this.ref || this.ref.current.dirty
    }

    get pristine(): boolean {
      return !!(this.ref && this.ref.current.pristine)
    }

    get value(): ?(any[]) {
      return this.ref ? this.ref.current.value : undefined
    }

    getRenderedComponent() {
      invariant(
        this.props.forwardRef,
        'If you want to access getRenderedComponent(), ' +
          'you must specify a forwardRef prop to FieldArray'
      )
      return this.ref && this.ref.current.getRenderedComponent()
    }

    render() {
      return createElement(ConnectedFieldArray, {
        ...this.props,
        name: this.name,
        ref: this.ref
      })
    }
  }

  FieldArray.propTypes = {
    name: PropTypes.string.isRequired,
    component: validateComponentProp,
    props: PropTypes.object,
    validate: PropTypes.oneOfType([PropTypes.func, PropTypes.arrayOf(PropTypes.func)]),
    warn: PropTypes.oneOfType([PropTypes.func, PropTypes.arrayOf(PropTypes.func)]),
    forwardRef: PropTypes.bool,
    _reduxForm: PropTypes.object
  }

  return withReduxForm(FieldArray)
}
