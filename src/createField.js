// @flow
import React, { Component, createElement } from 'react'
import PropTypes from 'prop-types'
import invariant from 'invariant'
import createConnectedField from './ConnectedField'
import shallowCompare from './util/shallowCompare'
import prefixName from './util/prefixName'
import plain from './structure/plain'
import { withReduxForm } from './ReduxFormContext'
import type { ElementRef } from 'react'
import type { Structure, ReactContext } from './types.js.flow'
import type { Props as PropsWithoutContext } from './FieldProps.types'
import validateComponentProp from './util/validateComponentProp'

type Props = ReactContext & PropsWithoutContext

function createField(structure: Structure<any, any>) {
  const ConnectedField = createConnectedField(structure)

  const { setIn } = structure

  class Field extends Component<Props> {
    ref: ElementRef<any> = React.createRef()

    constructor(props: Props) {
      super(props)
      if (!props._reduxForm) {
        throw new Error('Field must be inside a component decorated with reduxForm()')
      }
    }

    componentDidMount() {
      this.props._reduxForm.register(
        this.name,
        'Field',
        () => this.props.validate,
        () => this.props.warn
      )
    }

    shouldComponentUpdate(nextProps: Props, nextState?: Object) {
      return shallowCompare(this, nextProps, nextState)
    }

    componentDidUpdate(prevProps: Props) {
      const oldName = prefixName(prevProps, prevProps.name)
      const newName = prefixName(this.props, this.props.name)

      if (
        oldName !== newName ||
        // use deepEqual here because they could be a function or an array of functions
        !plain.deepEqual(prevProps.validate, this.props.validate) ||
        !plain.deepEqual(prevProps.warn, this.props.warn)
      ) {
        // unregister old name
        this.props._reduxForm.unregister(oldName)
        // register new name
        this.props._reduxForm.register(
          newName,
          'Field',
          () => this.props.validate,
          () => this.props.warn
        )
      }
    }

    componentWillUnmount() {
      this.props._reduxForm.unregister(this.name)
    }

    getRenderedComponent(): ?Component<any, any> {
      invariant(
        this.props.forwardRef,
        'If you want to access getRenderedComponent(), ' +
          'you must specify a forwardRef prop to Field'
      )
      return this.ref.current ? this.ref.current.getRenderedComponent() : undefined
    }

    get name(): string {
      return prefixName(this.props, this.props.name)
    }

    get dirty(): boolean {
      return !this.pristine
    }

    get pristine(): boolean {
      return !!(this.ref.current && this.ref.current.isPristine())
    }

    get value(): any {
      return this.ref.current && this.ref.current.getValue()
    }

    normalize = (name: string, value: any): any => {
      const { normalize } = this.props
      if (!normalize) {
        return value
      }
      const previousValues = this.props._reduxForm.getValues()
      const previousValue = this.value
      const nextValues = setIn(previousValues, name, value)
      return normalize(value, previousValue, nextValues, previousValues, name)
    }

    render() {
      return createElement(ConnectedField, {
        ...this.props,
        name: this.name,
        normalize: this.normalize,
        ref: this.ref
      })
    }
  }

  Field.propTypes = {
    name: PropTypes.string.isRequired,
    component: validateComponentProp,
    format: PropTypes.func,
    normalize: PropTypes.func,
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onDragStart: PropTypes.func,
    onDrop: PropTypes.func,
    parse: PropTypes.func,
    props: PropTypes.object,
    validate: PropTypes.oneOfType([PropTypes.func, PropTypes.arrayOf(PropTypes.func)]),
    warn: PropTypes.oneOfType([PropTypes.func, PropTypes.arrayOf(PropTypes.func)]),
    forwardRef: PropTypes.bool,
    immutableProps: PropTypes.arrayOf(PropTypes.string),
    _reduxForm: PropTypes.object
  }

  return withReduxForm(Field)
}

export default createField
