import { noop } from 'lodash'
/* eslint react/no-multi-comp:0 */
import React, { Component } from 'react'
import TestUtils from 'react-dom/test-utils'
import { Provider } from 'react-redux'
import { combineReducers as plainCombineReducers, createStore } from 'redux'
import { combineReducers as immutableCombineReducers } from 'redux-immutable'
import actions from '../actions'
import createField from '../createField'
import createFieldArray from '../createFieldArray'
import createReducer from '../createReducer'
import createReduxForm from '../createReduxForm'
import { formPropTypes } from '../propTypes'
import FormSection from '../FormSection'
import immutable from '../structure/immutable'
import immutableExpectations from '../structure/immutable/__tests__/expectations'
import plain from '../structure/plain'
import plainExpectations from '../structure/plain/__tests__/expectations'
import { SubmissionError } from '../SubmissionError'

import FormWrapper from '../Form'

const {
  change,
  clearSubmit,
  initialize,
  setSubmitFailed,
  setSubmitSucceeded,
  startSubmit,
  stopSubmit,
  submit,
  touch,
  updateSyncErrors
} = actions
const propsAtNthRender = (spy, callNumber) => spy.mock.calls[callNumber][0]
const propsAtLastRender = spy => propsAtNthRender(spy, spy.mock.calls.length - 1)

const describeReduxForm = (name, structure, combineReducers, setup) => {
  const { fromJS, getIn, setIn } = structure
  const reduxForm = createReduxForm(structure)
  const Field = createField(structure)
  const FieldArray = createFieldArray(structure)
  const reducer = createReducer(structure)

  describe(name, () => {
    beforeAll(() => {
      setup()
    })

    const makeStore = (initial = {}, logger) => {
      const reducers = { form: reducer }
      if (logger) {
        reducers.logger = logger
      }
      return createStore(combineReducers(reducers), fromJS({ form: initial }))
    }

    const makeForm = (renderSpy = noop) => {
      return class Form extends Component {
        render() {
          renderSpy(this.props)
          return (
            <div>
              <Field name="foo" component="input" />
            </div>
          )
        }
      }
    }

    const renderForm = (Form, formState, config = {}, ref) => {
      const store = makeStore({ testForm: formState })
      const Decorated = reduxForm({ form: 'testForm', ...config })(Form)
      return TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated ref={ref} />
        </Provider>
      )
    }

    const propChecker = (formState, renderSpy = noop, config = {}) => {
      let props
      const Form = makeForm(p => {
        props = p
        renderSpy(p)
      })
      renderForm(Form, formState, config)
      return props
    }

    it('should return a decorator function', () => {
      expect(typeof reduxForm).toBe('function')
    })

    it('should render without error', () => {
      const store = makeStore()
      class Form extends Component {
        render() {
          return <div />
        }
      }
      expect(() => {
        const Decorated = reduxForm({ form: 'testForm' })(Form)
        TestUtils.renderIntoDocument(
          <Provider store={store}>
            <Decorated />
          </Provider>
        )
      }).not.toThrow()
    })

    it('should update without error when there is no config', () => {
      const store = makeStore()
      const Form = () => <div />
      const Decorated = reduxForm()(Form)

      class Container extends Component {
        constructor(props) {
          super(props)
          this.state = {}
        }

        render() {
          return (
            <Provider store={store}>
              <div>
                <Decorated form="formname" foo={this.state.foo} />
                <button onClick={() => this.setState({ foo: 'bar' })} />
              </div>
            </Provider>
          )
        }
      }

      const dom = TestUtils.renderIntoDocument(<Container />)

      expect(() => {
        const button = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
        TestUtils.Simulate.click(button)
      }).not.toThrow()
    })

    it('should provide the correct props', () => {
      const props = propChecker({})
      expect(Object.keys(props).sort()).toEqual([
        '_reduxForm',
        'anyTouched',
        'array',
        'asyncValidate',
        'asyncValidating',
        'autofill',
        'blur',
        'change',
        'clearAsyncError',
        'clearFields',
        'clearSubmit',
        'clearSubmitErrors',
        'destroy',
        'dirty',
        'dispatch',
        'error',
        'form',
        'handleSubmit',
        'initialValues',
        'initialize',
        'initialized',
        'invalid',
        'pristine',
        'pure',
        'reset',
        'resetSection',
        'submit',
        'submitAsSideEffect',
        'submitFailed',
        'submitSucceeded',
        'submitting',
        'touch',
        'triggerSubmit',
        'untouch',
        'valid',
        'warning'
      ])
      expect(typeof props.anyTouched).toBe('boolean')
      expect(typeof props.array).toBe('object')
      expect(Object.keys(props.array).sort()).toEqual([
        'insert',
        'move',
        'pop',
        'push',
        'remove',
        'removeAll',
        'shift',
        'splice',
        'swap',
        'unshift'
      ])
      expect(typeof props.array.insert).toBe('function')
      expect(typeof props.array.move).toBe('function')
      expect(typeof props.array.pop).toBe('function')
      expect(typeof props.array.push).toBe('function')
      expect(typeof props.array.remove).toBe('function')
      expect(typeof props.array.removeAll).toBe('function')
      expect(typeof props.array.shift).toBe('function')
      expect(typeof props.array.splice).toBe('function')
      expect(typeof props.array.swap).toBe('function')
      expect(typeof props.array.unshift).toBe('function')
      expect(typeof props.asyncValidate).toBe('function')
      expect(typeof props.asyncValidating).toBe('boolean')
      expect(typeof props.autofill).toBe('function')
      expect(typeof props.blur).toBe('function')
      expect(typeof props.change).toBe('function')
      expect(typeof props.clearFields).toBe('function')
      expect(typeof props.destroy).toBe('function')
      expect(typeof props.dirty).toBe('boolean')
      expect(typeof props.form).toBe('string')
      expect(typeof props.handleSubmit).toBe('function')
      expect(typeof props.initialize).toBe('function')
      expect(typeof props.initialized).toBe('boolean')
      expect(typeof props.pristine).toBe('boolean')
      expect(typeof props.reset).toBe('function')
      expect(typeof props.resetSection).toBe('function')
      expect(typeof props.submitFailed).toBe('boolean')
      expect(typeof props.submitSucceeded).toBe('boolean')
      expect(typeof props.touch).toBe('function')
      expect(typeof props.untouch).toBe('function')
      expect(typeof props.valid).toBe('boolean')
    })

    it('should have declared all propTypes passed to decorated component', () => {
      const passedProps = Object.keys(propChecker({})).sort()
      const declaredPropTypes = Object.keys(formPropTypes)
        .concat('_reduxForm')
        .sort()

      expect(passedProps).toEqual(declaredPropTypes)
    })

    describe('dirty prop', () => {
      it('should default `false`', () => {
        expect(propChecker({}).dirty).toBe(false)
      })
      it('should be `true` when `state.values` exists but `state.initial` does not exist', () => {
        expect(
          propChecker({
            // no initial values
            values: {
              foo: 'bar'
            }
          }).dirty
        ).toBe(true)
      })
      it('should be `false` when `state.initial` equals `state.values`', () => {
        expect(
          propChecker({
            initial: {
              foo: 'bar'
            },
            values: {
              foo: 'bar'
            }
          }).dirty
        ).toBe(false)
      })
      it('should be `true` when `state.initial` does not equal `state.values`', () => {
        expect(
          propChecker({
            initial: {
              foo: 'bar'
            },
            values: {
              foo: 'baz'
            }
          }).dirty
        ).toBe(true)
      })
    })

    describe('pristine prop', () => {
      it('should default to `true`', () => {
        expect(propChecker({}).pristine).toBe(true)
      })
      it('should be `false` when `state.values` exists but `state.initial` does not exist', () => {
        expect(
          propChecker({
            // no initial values
            values: {
              foo: 'bar'
            }
          }).pristine
        ).toBe(false)
      })
      it('should be `true` when `state.initial` equals `state.values`', () => {
        expect(
          propChecker({
            initial: {
              foo: 'bar'
            },
            values: {
              foo: 'bar'
            }
          }).pristine
        ).toBe(true)
      })
      it('should be `false` when the `state.values` does not equal `state.initial`', () => {
        expect(
          propChecker({
            initial: {
              foo: 'bar'
            },
            values: {
              foo: 'baz'
            }
          }).pristine
        ).toBe(false)
      })
    })

    describe('valid prop', () => {
      const checkValidPropGivenErrors = (errors, expectation) => {
        // Check Sync Errors
        expect(
          propChecker({}, undefined, {
            validate: () => errors
          }).valid
        ).toBe(expectation)

        // Check Async Errors
        expect(
          propChecker({
            asyncErrors: errors
          }).valid
        ).toBe(expectation)
      }

      it('should default to `true`', () => {
        checkValidPropGivenErrors({}, true)
      })

      it('should be `false` when `errors` has a `string` property', () => {
        checkValidPropGivenErrors({ foo: 'bar' }, false)
      })

      it('should be `false` when `errors` has a `number` property', () => {
        checkValidPropGivenErrors({ foo: 42 }, false)
      })

      it('should be `true` when `errors` has an `undefined` property', () => {
        checkValidPropGivenErrors({ foo: undefined }, true)
      })

      it('should be `true` when `errors` has a `null` property', () => {
        checkValidPropGivenErrors({ foo: null }, true)
      })

      it('should be `true` when `errors` has an empty array', () => {
        checkValidPropGivenErrors(
          {
            myArrayField: []
          },
          true
        )
      })

      it('should be `true` when `errors` has an array with only `undefined` values', () => {
        checkValidPropGivenErrors(
          {
            myArrayField: [undefined, undefined]
          },
          true
        )
      })

      it('should be `true` when `errors` has an array containing strings', () => {
        // Note: I didn't write the isValid, but my intuition tells me this seems incorrect. – ncphillips
        checkValidPropGivenErrors(
          {
            myArrayField: ['baz']
          },
          true
        )
      })
    })

    describe('invalid prop', () => {
      const checkInvalidPropGivenErrors = (errors, expectation) => {
        // Check Sync Errors
        expect(
          propChecker({}, undefined, {
            validate: () => errors
          }).invalid
        ).toBe(expectation)

        // Check Async Errors
        expect(
          propChecker({
            asyncErrors: errors
          }).invalid
        ).toBe(expectation)
      }

      it('should default to `false`', () => {
        checkInvalidPropGivenErrors({}, false)
      })

      it('should be `true` when errors has a `string` propertry', () => {
        checkInvalidPropGivenErrors({ foo: 'sync error' }, true)
      })

      it('should be `true` when errors has a `number` property', () => {
        checkInvalidPropGivenErrors({ foo: 12 }, true)
      })

      it('should be `false` when errors has only an `undefined` property', () => {
        checkInvalidPropGivenErrors({ foo: undefined }, false)
      })

      it('should be `false` when errors has only a `null` property', () => {
        checkInvalidPropGivenErrors({ foo: null }, false)
      })

      it('should be `false` when errors has only an empty array', () => {
        checkInvalidPropGivenErrors({ myArrayField: [] }, false)
      })
    })

    it('should provide submitting prop', () => {
      expect(propChecker({}).submitting).toBe(false)
      expect(propChecker({ submitting: true }).submitting).toBe(true)
      expect(propChecker({ submitting: false }).submitting).toBe(false)
    })

    it('should put props under prop namespace if specified', () => {
      const props = propChecker({}, noop, {
        propNamespace: 'fooProps',
        someOtherProp: 'whatever'
      })
      expect(typeof props.fooProps).toBe('object')
      expect(props.dispatch).toBeFalsy()
      expect(props.dirty).toBeFalsy()
      expect(props.pristine).toBeFalsy()
      expect(props.submitting).toBeFalsy()
      expect(props.someOtherProp).toBeTruthy()
      expect(typeof props.fooProps.dispatch).toBe('function')
      expect(typeof props.fooProps.dirty).toBe('boolean')
      expect(typeof props.fooProps.pristine).toBe('boolean')
      expect(typeof props.fooProps.submitting).toBe('boolean')
      expect(typeof props.fooProps.array).toBe('object')
      expect(props.fooProps.someOtherProp).toBeFalsy()
    })

    describe('should bind action creators to form prop', () => {
      it('should provide bound array action creators', () => {
        const arrayProp = propChecker({}).array
        expect(arrayProp).toBeTruthy()
        expect(typeof arrayProp.insert).toBe('function')
        expect(typeof arrayProp.pop).toBe('function')
        expect(typeof arrayProp.push).toBe('function')
        expect(typeof arrayProp.remove).toBe('function')
        expect(typeof arrayProp.shift).toBe('function')
        expect(typeof arrayProp.splice).toBe('function')
        expect(typeof arrayProp.swap).toBe('function')
        expect(typeof arrayProp.unshift).toBe('function')
      })

      it('should re-bind on form prop change', () => {
        const logger = jest.fn((state = {}) => state)
        const store = makeStore({}, logger)
        const inputRender = jest.fn(props => <input {...props.input} />)
        const Form = ({ onClick }) => (
          <div>
            <Field name="textfield" component={inputRender} type="text" />
          </div>
        )
        const Decorated = reduxForm({})(Form)

        class Container extends Component {
          constructor(props) {
            super(props)
            this.state = { form: 'fooForm' }
          }

          render() {
            return (
              <Provider store={store}>
                <div>
                  <Decorated form={this.state.form} />
                  <button onClick={() => this.setState({ form: 'barForm' })} />
                </div>
              </Provider>
            )
          }
        }

        const dom = TestUtils.renderIntoDocument(<Container />)
        const input1 = TestUtils.findRenderedDOMComponentWithTag(dom, 'input')
        TestUtils.Simulate.change(input1, { target: { value: 'foo' } })

        // the change action meta `form` is `fooForm`
        let callIndex = logger.mock.calls.length - 1
        expect(logger.mock.calls[callIndex++][1]).toEqual(
          change('fooForm', 'textfield', 'foo', false, false)
        )

        // switch the form prop
        const button = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
        TestUtils.Simulate.click(button)

        const input2 = TestUtils.findRenderedDOMComponentWithTag(dom, 'input')
        TestUtils.Simulate.change(input2, { target: { value: 'bar' } })

        // check the change action meta `form` changed to `barForm`
        expect(logger.mock.calls[callIndex++][1]).toEqual(
          change('barForm', 'textfield', 'bar', false, false)
        )
      })
    })

    it('should not rerender unless form-wide props (except value!) change', () => {
      const spy = jest.fn()
      const { dispatch } = propChecker({}, spy, {
        validate: values => {
          const foo = getIn(values, 'foo')
          return foo && foo.length > 5 ? { foo: 'Too long' } : {}
        }
      }) // render 0
      expect(spy).toHaveBeenCalledTimes(1)

      // simulate typing the word "giraffe"
      dispatch(change('testForm', 'foo', 'g')) // render 1 (now dirty)
      expect(spy).toHaveBeenCalledTimes(2)

      dispatch(change('testForm', 'foo', 'gi')) // no render
      dispatch(change('testForm', 'foo', 'gir')) // no render
      dispatch(change('testForm', 'foo', 'gira')) // no render
      dispatch(change('testForm', 'foo', 'giraf')) // no render
      dispatch(change('testForm', 'foo', 'giraff')) // render 2 (invalid)
      expect(spy).toHaveBeenCalledTimes(3)
      dispatch(change('testForm', 'foo', 'giraffe')) // no render

      dispatch(change('testForm', 'foo', '')) // render 3 (clean/valid)
      expect(spy).toHaveBeenCalledTimes(5) // two renders, one to change value, and other to revalidate

      expect(propsAtNthRender(spy, 0).dirty).toBe(false)
      expect(propsAtNthRender(spy, 0).invalid).toBe(false)
      expect(propsAtNthRender(spy, 0).pristine).toBe(true)
      expect(propsAtNthRender(spy, 0).valid).toBe(true)

      expect(propsAtNthRender(spy, 1).dirty).toBe(true)
      expect(propsAtNthRender(spy, 1).invalid).toBe(false)
      expect(propsAtNthRender(spy, 1).pristine).toBe(false)
      expect(propsAtNthRender(spy, 1).valid).toBe(true)

      expect(propsAtNthRender(spy, 2).dirty).toBe(true)
      expect(propsAtNthRender(spy, 2).invalid).toBe(true)
      expect(propsAtNthRender(spy, 2).pristine).toBe(false)
      expect(propsAtNthRender(spy, 2).valid).toBe(false)

      expect(propsAtNthRender(spy, 4).dirty).toBe(false)
      expect(propsAtNthRender(spy, 4).invalid).toBe(false)
      expect(propsAtNthRender(spy, 4).pristine).toBe(true)
      expect(propsAtNthRender(spy, 4).valid).toBe(true)
    })

    it('should rerender on every change if pure is false', () => {
      const spy = jest.fn()
      const { dispatch } = propChecker({}, spy, {
        pure: false
      })
      expect(spy).toHaveBeenCalledTimes(2) // twice, second one is for after field registration

      // simulate typing the word "giraffe"
      dispatch(change('testForm', 'foo', 'g'))
      expect(spy).toHaveBeenCalledTimes(3)
      dispatch(change('testForm', 'foo', 'gi'))
      expect(spy).toHaveBeenCalledTimes(4)
      dispatch(change('testForm', 'foo', 'gir'))
      expect(spy).toHaveBeenCalledTimes(5)
      dispatch(change('testForm', 'foo', 'gira'))
      expect(spy).toHaveBeenCalledTimes(6)
      dispatch(change('testForm', 'foo', 'giraf'))
      expect(spy).toHaveBeenCalledTimes(7)
      dispatch(change('testForm', 'foo', 'giraff'))
      expect(spy).toHaveBeenCalledTimes(8)
      dispatch(change('testForm', 'foo', 'giraffe'))
      expect(spy).toHaveBeenCalledTimes(9)
    })

    it('should strict equals props in immutableProps', () => {
      const store = makeStore({})
      const inputRender = jest.fn(props => <input {...props.input} />)
      const formRender = jest.fn()

      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="deep.foo" component={inputRender} type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm',
        immutableProps: ['foo']
      })(Form)

      class Container extends Component {
        constructor(props) {
          super(props)
          this.state = {
            foo: {
              get no() {
                throw new Error('props inside an immutableProps object should not be looked at')
              }
            }
          }
        }

        render() {
          return (
            <div>
              <Provider store={store}>
                <Decorated {...this.state} foo={this.state.foo} />
              </Provider>
              <button onClick={() => this.setState({ foo: { no: undefined } })}>Init</button>
            </div>
          )
        }
      }

      const dom = TestUtils.renderIntoDocument(<Container />)
      expect(formRender).toHaveBeenCalled()
      expect(formRender).toHaveBeenCalledTimes(1)

      expect(inputRender).toHaveBeenCalled()
      expect(inputRender).toHaveBeenCalledTimes(1)

      // initialize
      const initButton = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')

      TestUtils.Simulate.click(initButton)

      expect(formRender).toHaveBeenCalledTimes(2)
      expect(inputRender).toHaveBeenCalledTimes(1)
    })

    it('should set checkbox values to false when unchecked', () => {
      const store = makeStore({})
      const inputRender = jest.fn(props => <input {...props.input} type="checkbox" />)
      const formRender = jest.fn()
      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="foo" component={inputRender} type="checkbox" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({ form: 'testForm' })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated />
        </Provider>
      )
      const checkbox = TestUtils.scryRenderedDOMComponentsWithTag(dom, 'input').find(
        element => element.getAttribute('name') === 'foo'
      )

      expect(formRender).toHaveBeenCalledTimes(1)
      expect(inputRender).toHaveBeenCalledTimes(1)
      expect(getIn(store.getState(), 'form.testForm.values.foo')).toBeFalsy()

      expect(propsAtNthRender(inputRender, 0).input.checked).toBe(false)
      TestUtils.Simulate.change(checkbox, {
        target: { type: 'checkbox', checked: true }
      })

      expect(inputRender).toHaveBeenCalledTimes(2)
      expect(propsAtNthRender(inputRender, 1).input.checked).toBe(true)
      expect(getIn(store.getState(), 'form.testForm.values.foo')).toBe(true)

      TestUtils.Simulate.change(checkbox, {
        target: { type: 'checkbox', checked: false }
      })

      expect(inputRender).toHaveBeenCalledTimes(3)
      expect(propsAtNthRender(inputRender, 2).input.value).toBe(false)
      expect(getIn(store.getState(), 'form.testForm.values.foo')).toBe(false)
    })

    it('should set checkbox values to false when unchecked (when initialized)', () => {
      const store = makeStore({})
      const inputRender = jest.fn(props => <input {...props.input} type="checkbox" />)
      const formRender = jest.fn()
      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="foo" component={inputRender} type="checkbox" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm',
        initialValues: { foo: true }
      })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated />
        </Provider>
      )
      const checkbox = TestUtils.scryRenderedDOMComponentsWithTag(dom, 'input').find(
        element => element.getAttribute('name') === 'foo'
      )

      expect(formRender).toHaveBeenCalledTimes(2)
      expect(inputRender).toHaveBeenCalledTimes(2)
      expect(getIn(store.getState(), 'form.testForm.values.foo')).toBe(true)

      expect(propsAtNthRender(inputRender, 1).input.checked).toBe(true)
      TestUtils.Simulate.change(checkbox, {
        target: { type: 'checkbox', checked: false }
      })

      expect(inputRender).toHaveBeenCalledTimes(3)
      expect(propsAtNthRender(inputRender, 2).input.checked).toBe(false)
      expect(getIn(store.getState(), 'form.testForm.values.foo')).toBe(false)

      TestUtils.Simulate.change(checkbox, {
        target: { type: 'checkbox', checked: true }
      })

      expect(inputRender).toHaveBeenCalledTimes(4)
      expect(propsAtNthRender(inputRender, 3).input.value).toBe(true)
      expect(getIn(store.getState(), 'form.testForm.values.foo')).toBe(true)
    })

    it('should initialize values with initialValues on first render', () => {
      const store = makeStore({})
      const inputRender = jest.fn(props => <input {...props.input} />)
      const formRender = jest.fn()
      const initialValues = {
        deep: {
          foo: 'bar'
        }
      }
      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="deep.foo" component={inputRender} type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({ form: 'testForm' })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated initialValues={initialValues} />
        </Provider>
      )
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            initial: initialValues,
            values: initialValues,
            registeredFields: {
              'deep.foo': { name: 'deep.foo', type: 'Field', count: 1 }
            }
          }
        }
      })
      expect(formRender).toHaveBeenCalled()
      expect(formRender).toHaveBeenCalledTimes(2)
      const checkProps = props => {
        expect(props.pristine).toBe(true)
        expect(props.dirty).toBe(false)
        expect(props.initialized).toBe(true)
        expect(props.initialValues).toEqualMap(initialValues)
      }
      checkProps(propsAtNthRender(formRender, 1))

      expect(inputRender).toHaveBeenCalled()
      expect(inputRender).toHaveBeenCalledTimes(2)
      expect(propsAtNthRender(inputRender, 1).meta.pristine).toBe(true)
      expect(propsAtNthRender(inputRender, 1).meta.dirty).toBe(false)
      expect(propsAtNthRender(inputRender, 1).input.value).toBe('bar')
    })

    it('should support calling change in Form componentDidMount', () => {
      const store = makeStore({})
      const inputRender = jest.fn(props => <input {...props.input} />)
      const formRender = jest.fn()
      const initialValues = {
        deep: {
          foo: 'bar'
        }
      }
      class Form extends Component {
        componentDidMount() {
          this.props.change('deep.foo', 'baz')
        }
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="deep.foo" component={inputRender} type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({ form: 'testForm' })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated initialValues={initialValues} />
        </Provider>
      )
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            initial: initialValues,
            values: {
              deep: {
                foo: 'baz'
              }
            },
            registeredFields: {
              'deep.foo': { name: 'deep.foo', type: 'Field', count: 1 }
            }
          }
        }
      })
      expect(formRender).toHaveBeenCalled()
      expect(formRender).toHaveBeenCalledTimes(2)
      const checkProps = props => {
        expect(props.pristine).toBe(false)
        expect(props.dirty).toBe(true)
        expect(props.initialized).toBe(true)
        expect(props.initialValues).toEqualMap(initialValues)
      }
      checkProps(propsAtNthRender(formRender, 1))

      expect(inputRender).toHaveBeenCalled()
      expect(inputRender).toHaveBeenCalledTimes(2)

      // should be dirty on second render, after change completes
      expect(propsAtNthRender(inputRender, 1).meta.pristine).toBe(false)
      expect(propsAtNthRender(inputRender, 1).meta.dirty).toBe(true)
      expect(propsAtNthRender(inputRender, 1).input.value).toBe('baz')
    })

    it('should initialize with initialValues on later render if not already initialized', () => {
      const store = makeStore({})
      const inputRender = jest.fn(props => <input {...props.input} />)
      const formRender = jest.fn()
      const initialValues = {
        deep: {
          foo: 'bar'
        }
      }

      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="deep.foo" component={inputRender} type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({ form: 'testForm' })(Form)

      class Container extends Component {
        constructor(props) {
          super(props)
          this.state = {}
        }

        render() {
          return (
            <div>
              <Provider store={store}>
                <Decorated {...this.state} />
              </Provider>
              <button onClick={() => this.setState({ initialValues })}>Init</button>
            </div>
          )
        }
      }

      const dom = TestUtils.renderIntoDocument(<Container />)
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: {
              'deep.foo': { name: 'deep.foo', type: 'Field', count: 1 }
            }
          }
        }
      })
      expect(formRender).toHaveBeenCalled()
      expect(formRender).toHaveBeenCalledTimes(1)

      expect(inputRender).toHaveBeenCalled()
      expect(inputRender).toHaveBeenCalledTimes(1)
      const checkInputProps = (props, value) => {
        expect(props.meta.pristine).toBe(true)
        expect(props.meta.dirty).toBe(false)
        expect(props.input.value).toBe(value)
      }
      checkInputProps(inputRender.mock.calls[0][0], '')

      // initialize
      const initButton = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
      TestUtils.Simulate.click(initButton)

      // check initialized state
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: {
              'deep.foo': { name: 'deep.foo', type: 'Field', count: 1 }
            },
            initial: initialValues,
            values: initialValues
          }
        }
      })

      // no need to rerender form on initialize
      expect(formRender).toHaveBeenCalledTimes(2)

      // check rerendered input
      expect(inputRender).toHaveBeenCalledTimes(2)
      checkInputProps(inputRender.mock.calls[1][0], 'bar')
    })

    it('should NOT reinitialize with initialValues', () => {
      const store = makeStore({})
      const inputRender = jest.fn(props => <input {...props.input} />)
      const formRender = jest.fn()
      const initialValues1 = {
        deep: {
          foo: 'bar'
        }
      }
      const initialValues2 = {
        deep: {
          foo: 'baz'
        }
      }

      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="deep.foo" component={inputRender} type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({ form: 'testForm' })(Form)

      class Container extends Component {
        constructor(props) {
          super(props)
          this.state = { initialValues: initialValues1 }
        }

        render() {
          return (
            <div>
              <Provider store={store}>
                <Decorated {...this.state} />
              </Provider>
              <button onClick={() => this.setState({ initialValues: initialValues2 })}>Init</button>
            </div>
          )
        }
      }

      const dom = TestUtils.renderIntoDocument(<Container />)
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: {
              'deep.foo': { name: 'deep.foo', type: 'Field', count: 1 }
            },
            initial: initialValues1,
            values: initialValues1
          }
        }
      })
      expect(formRender).toHaveBeenCalled()
      expect(formRender).toHaveBeenCalledTimes(2)

      expect(inputRender).toHaveBeenCalled()
      expect(inputRender).toHaveBeenCalledTimes(2)
      const checkInputProps = (props, value) => {
        expect(props.meta.pristine).toBe(true)
        expect(props.meta.dirty).toBe(false)
        expect(props.input.value).toBe(value)
      }
      checkInputProps(inputRender.mock.calls[1][0], 'bar')

      // initialize
      const initButton = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
      TestUtils.Simulate.click(initButton)

      // check initialized state
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: {
              'deep.foo': { name: 'deep.foo', type: 'Field', count: 1 }
            },
            initial: initialValues1,
            values: initialValues1
          }
        }
      })

      // rerender just because prop changed
      expect(formRender).toHaveBeenCalledTimes(2)

      // no need to rerender input since nothing changed
      expect(inputRender).toHaveBeenCalledTimes(2)
    })

    it('should reinitialize with initialValues if enableReinitialize', () => {
      const store = makeStore({})
      const inputRender = jest.fn(props => <input {...props.input} />)
      const formRender = jest.fn()
      const initialValues1 = {
        deep: {
          foo: 'bar'
        }
      }
      const initialValues2 = {
        deep: {
          foo: 'baz'
        }
      }

      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="deep.foo" component={inputRender} type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm',
        enableReinitialize: true
      })(Form)

      class Container extends Component {
        constructor(props) {
          super(props)
          this.state = { initialValues: initialValues1 }
        }

        render() {
          return (
            <div>
              <Provider store={store}>
                <Decorated {...this.state} />
              </Provider>
              <button onClick={() => this.setState({ initialValues: initialValues2 })}>Init</button>
            </div>
          )
        }
      }

      const dom = TestUtils.renderIntoDocument(<Container />)

      const checkInputProps = (props, value, pristine = true, dirty = false) => {
        expect(props.meta.pristine).toBe(pristine)
        expect(props.meta.dirty).toBe(dirty)
        expect(props.input.value).toBe(value)
      }

      // Check initial state
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: {
              'deep.foo': { name: 'deep.foo', type: 'Field', count: 1 }
            },
            initial: initialValues1,
            values: initialValues1
          }
        }
      })

      // Expect renders due to initialization.
      expect(formRender).toHaveBeenCalled()
      expect(formRender).toHaveBeenCalledTimes(2)

      expect(inputRender).toHaveBeenCalled()
      expect(inputRender).toHaveBeenCalledTimes(2)

      // Expect that input value has been initialized
      checkInputProps(inputRender.mock.calls[1][0], 'bar')

      // Change input value and check if it is dirty and not pristine
      const onChange = inputRender.mock.calls[1][0].input.onChange
      onChange('dirtyvalue')

      // Expect rerenders due to the change.
      expect(formRender).toHaveBeenCalledTimes(3)

      expect(inputRender).toHaveBeenCalledTimes(3)

      // Expect that input value has been changed and is dirty now
      checkInputProps(inputRender.mock.calls[2][0], 'dirtyvalue', false, true)

      // Re-initialize form and check if it is pristine and not dirty
      const initButton = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
      TestUtils.Simulate.click(initButton)

      // Check re-initialized state
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: {
              'deep.foo': { name: 'deep.foo', type: 'Field', count: 1 }
            },
            initial: initialValues2,
            values: initialValues2
          }
        }
      })

      // Expect rerenders due to the re-initialization.
      expect(formRender).toHaveBeenCalledTimes(4)

      expect(inputRender).toHaveBeenCalledTimes(4)

      // Expect that input value has been re-initialized and is not dirty anymore
      checkInputProps(inputRender.mock.calls[3][0], 'baz')
    })

    it('should retain dirty fields if keepDirtyOnReinitialize is set', () => {
      const store = makeStore({})
      const inputRender = jest.fn(props => <input {...props.input} />)
      const formRender = jest.fn()
      const initialValues1 = {
        deep: {
          foo: 'bar'
        }
      }
      const initialValues2 = {
        deep: {
          foo: 'baz'
        }
      }

      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="deep.foo" component={inputRender} type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm',
        enableReinitialize: true,
        keepDirtyOnReinitialize: true
      })(Form)

      class Container extends Component {
        constructor(props) {
          super(props)
          this.state = { initialValues: initialValues1 }
        }

        render() {
          return (
            <div>
              <Provider store={store}>
                <Decorated {...this.state} />
              </Provider>
              <button onClick={() => this.setState({ initialValues: initialValues2 })}>Init</button>
            </div>
          )
        }
      }

      const dom = TestUtils.renderIntoDocument(<Container />)
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: {
              'deep.foo': { name: 'deep.foo', type: 'Field', count: 1 }
            },
            initial: initialValues1,
            values: initialValues1
          }
        }
      })
      expect(formRender).toHaveBeenCalled()
      expect(formRender).toHaveBeenCalledTimes(2)

      expect(inputRender).toHaveBeenCalled()
      expect(inputRender).toHaveBeenCalledTimes(2)
      const checkInputProps = (props, value, dirty) => {
        expect(props.meta.pristine).toBe(!dirty)
        expect(props.meta.dirty).toBe(dirty)
        expect(props.input.value).toBe(value)
      }
      checkInputProps(inputRender.mock.calls[1][0], 'bar', false)

      // Change the input value.
      const onChange = inputRender.mock.calls[1][0].input.onChange
      onChange('dirtyvalue')

      // Expect rerenders due to the change.
      expect(formRender).toHaveBeenCalledTimes(3)
      expect(inputRender).toHaveBeenCalledTimes(3)

      // Reinitialize the form
      const initButton = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
      TestUtils.Simulate.click(initButton)

      // check initialized state
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: {
              'deep.foo': { name: 'deep.foo', type: 'Field', count: 1 }
            },
            initial: initialValues2,
            values: {
              deep: {
                foo: 'dirtyvalue'
              }
            }
          }
        }
      })

      // Expect the form not to rerender, since the value did not change.
      expect(formRender).toHaveBeenCalledTimes(3)

      // should rerender input with the dirty value and new meta.initial
      expect(inputRender).toHaveBeenCalledTimes(4)
      checkInputProps(inputRender.mock.calls[2][0], 'dirtyvalue', true)
      checkInputProps(inputRender.mock.calls[3][0], 'dirtyvalue', true)
    })

    it('should not retain dirty fields if keepDirtyOnReinitialize is not set', () => {
      const store = makeStore({})
      const inputRender = jest.fn(props => <input {...props.input} />)
      const formRender = jest.fn()
      const initialValues1 = {
        deep: {
          foo: 'bar'
        }
      }
      const initialValues2 = {
        deep: {
          foo: 'baz'
        }
      }

      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="deep.foo" component={inputRender} type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm',
        enableReinitialize: true
      })(Form)

      class Container extends Component {
        constructor(props) {
          super(props)
          this.state = { initialValues: initialValues1 }
        }

        render() {
          return (
            <div>
              <Provider store={store}>
                <Decorated {...this.state} />
              </Provider>
              <button onClick={() => this.setState({ initialValues: initialValues2 })}>Init</button>
            </div>
          )
        }
      }

      const dom = TestUtils.renderIntoDocument(<Container />)
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: {
              'deep.foo': { name: 'deep.foo', type: 'Field', count: 1 }
            },
            initial: initialValues1,
            values: initialValues1
          }
        }
      })
      expect(formRender).toHaveBeenCalled()
      expect(formRender).toHaveBeenCalledTimes(2)

      expect(inputRender).toHaveBeenCalled()
      expect(inputRender).toHaveBeenCalledTimes(2)
      const checkInputProps = (props, value, dirty) => {
        expect(props.meta.pristine).toBe(!dirty)
        expect(props.meta.dirty).toBe(dirty)
        expect(props.input.value).toBe(value)
      }
      checkInputProps(inputRender.mock.calls[1][0], 'bar', false)

      // Change the input value.
      const onChange = inputRender.mock.calls[1][0].input.onChange
      onChange('dirtyvalue')

      // Expect rerenders due to the change.
      expect(formRender).toHaveBeenCalledTimes(3)
      expect(inputRender).toHaveBeenCalledTimes(3)

      // Reinitialize the form
      const initButton = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
      TestUtils.Simulate.click(initButton)

      // check initialized state
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: {
              'deep.foo': { name: 'deep.foo', type: 'Field', count: 1 }
            },
            initial: initialValues2,
            values: initialValues2
          }
        }
      })

      // Expect the form to rerender, since the value was replaced.
      expect(formRender).toHaveBeenCalledTimes(4)

      // should rerender input with the pristine value.
      expect(inputRender).toHaveBeenCalledTimes(4)
      checkInputProps(inputRender.mock.calls[3][0], 'baz', false)
    })

    it('should be pristine after initialize() if enableReinitialize', () => {
      const store = makeStore({})
      const inputRender = jest.fn(props => <input {...props.input} />)
      const formRender = jest.fn()
      const initialValues1 = {
        deep: {
          foo: 'bar'
        }
      }

      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="deep.foo" component={inputRender} type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm',
        enableReinitialize: true
      })(Form)

      class Container extends Component {
        constructor(props) {
          super(props)
          this.state = { initialValues: initialValues1 }
        }

        render() {
          return (
            <div>
              <Provider store={store}>
                <Decorated {...this.state} />
              </Provider>
            </div>
          )
        }
      }

      TestUtils.renderIntoDocument(<Container />)

      propsAtLastRender(inputRender).input.onChange('newBar')

      expect(propsAtLastRender(inputRender).input.value).toBe('newBar')
      expect(propsAtLastRender(inputRender).meta.pristine).toBe(false)
      expect(propsAtLastRender(formRender).pristine).toBe(false)

      store.dispatch(
        initialize('testForm', {
          deep: {
            foo: 'baz'
          }
        })
      )

      expect(propsAtLastRender(inputRender).input.value).toBe('baz')
      expect(propsAtLastRender(inputRender).meta.pristine).toBe(true)
      expect(propsAtLastRender(formRender).pristine).toBe(true)
    })

    it('should have initialized prop after initialization from initialValues config', () => {
      const store = makeStore({})
      const inputRender = jest.fn(props => <input {...props.input} />)
      const formRender = jest.fn()
      const initialValues = {
        foo: 'bar'
      }

      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="foo" component={inputRender} type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm',
        initialValues
      })(Form)

      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated />
        </Provider>
      )

      expect(formRender).toHaveBeenCalled()
      expect(formRender).toHaveBeenCalledTimes(2) // initial + after initialize
      expect(propsAtNthRender(formRender, 1).initialized).toBe(true)
    })

    it('should have initialized prop after initialization from initialize()', () => {
      const store = makeStore({})
      const inputRender = jest.fn(props => <input {...props.input} />)
      const formRender = jest.fn()
      const initialValues = {
        foo: 'bar'
      }

      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="foo" component={inputRender} type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm'
      })(Form)

      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated />
        </Provider>
      )

      expect(formRender).toHaveBeenCalled()
      expect(formRender).toHaveBeenCalledTimes(1)
      expect(propsAtNthRender(formRender, 0).initialized).toBe(false)

      // initialize with action
      propsAtNthRender(formRender, 0).initialize(initialValues)

      // check initialized prop
      expect(formRender).toHaveBeenCalledTimes(2)
      expect(propsAtNthRender(formRender, 1).initialized).toBe(true)
    })

    it('should make pristine any dirty field that has the new initial value, when keepDirtyOnReinitialize', () => {
      const store = makeStore({})
      const inputRender = jest.fn(props => <input {...props.input} />)
      const formRender = jest.fn()
      const initialValues1 = {
        deep: {
          foo: 'bar'
        }
      }
      const initialValues2 = {
        deep: {
          foo: 'futurevalue'
        }
      }

      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="deep.foo" component={inputRender} type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm',
        enableReinitialize: true,
        keepDirtyOnReinitialize: true
      })(Form)

      class Container extends Component {
        constructor(props) {
          super(props)
          this.state = { initialValues: initialValues1 }
        }

        render() {
          return (
            <div>
              <Provider store={store}>
                <Decorated {...this.state} />
              </Provider>
              <button onClick={() => this.setState({ initialValues: initialValues2 })}>Init</button>
            </div>
          )
        }
      }

      const dom = TestUtils.renderIntoDocument(<Container />)
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: {
              'deep.foo': { name: 'deep.foo', type: 'Field', count: 1 }
            },
            initial: initialValues1,
            values: initialValues1
          }
        }
      })
      expect(formRender).toHaveBeenCalled()
      expect(formRender).toHaveBeenCalledTimes(2)

      expect(inputRender).toHaveBeenCalled()
      expect(inputRender).toHaveBeenCalledTimes(2)
      const checkInputProps = (props, value, dirty) => {
        expect(props.meta.pristine).toBe(!dirty)
        expect(props.meta.dirty).toBe(dirty)
        expect(props.input.value).toBe(value)
      }
      checkInputProps(inputRender.mock.calls[1][0], 'bar', false)

      // Change the input value.
      const onChange = inputRender.mock.calls[1][0].input.onChange
      onChange('futurevalue')

      // Expect rerenders due to the change.
      expect(formRender).toHaveBeenCalledTimes(3)
      expect(inputRender).toHaveBeenCalledTimes(3)

      // Reinitialize the form
      const initButton = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
      TestUtils.Simulate.click(initButton)

      // check initialized state
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: {
              'deep.foo': { name: 'deep.foo', type: 'Field', count: 1 }
            },
            initial: initialValues2,
            values: initialValues2
          }
        }
      })

      // Expect the form to rerender only once more because the value did
      // not change.
      expect(formRender).toHaveBeenCalledTimes(4)

      // should rerender input with the new value that is now pristine.
      expect(inputRender).toHaveBeenCalledTimes(4)
      checkInputProps(inputRender.mock.calls[3][0], 'futurevalue', false)
    })

    // Test related to #1436
    /*
     it('should allow initialization via action to set pristine', () => {
     const store = makeStore({})
     const inputRender = createSpy(props => <input {...props.input}/>).andCallThrough()
     const formRender = createSpy()
     const initialValues1 = {
     deep: {
     foo: 'bar'
     }
     }
     const initialValues2 = {
     deep: {
     foo: 'baz'
     }
     }

     class Form extends Component {
     render() {
     formRender(this.props)
     return (
     <form>
     <Field name="deep.foo" component={inputRender} type="text"/>
     </form>
     )
     }
     }
     const Decorated = reduxForm({
     form: 'testForm',
     initialValues: initialValues1
     })(Form)

     TestUtils.renderIntoDocument(
     <Provider store={store}>
     <Decorated/>
     </Provider>
     )
     expect(store.getState()).toEqualMap({
     form: {
     testForm: {
     registeredFields: { 'deep.foo': { name: 'deep.foo', type: 'Field', count: 1 } },
     initial: initialValues1,
     values: initialValues1
     }
     }
     })
     expect(formRender).toHaveBeenCalled()
     expect(formRender.calls.length).toBe(1)
     expect(propsAtNthRender(formRender, 0).pristine).toBe(true)

     expect(inputRender).toHaveBeenCalled()
     expect(inputRender.calls.length).toBe(1)
     expect(propsAtNthRender(inputRender, 0).meta.pristine).toBe(true)
     expect(propsAtNthRender(inputRender, 0).input.value).toBe('bar')

     // check initialized state
     expect(store.getState()).toEqualMap({
     form: {
     testForm: {
     registeredFields: {
     'deep.foo': { name: 'deep.foo', type: 'Field', count: 1 }
     },
     initial: initialValues1,
     values: initialValues1
     }
     }
     })

     // initialize with action
     store.dispatch(initialize('testForm', initialValues2))

     // check initialized state
     expect(store.getState()).toEqualMap({
     form: {
     testForm: {
     registeredFields: {
     'deep.foo': { name: 'deep.foo', type: 'Field', count: 1 }
     },
     initial: initialValues2,
     values: initialValues2
     }
     }
     })

     // rerendered
     expect(formRender.calls.length).toBe(2)
     expect(propsAtNthRender(formRender, 1).pristine).toBe(true)

     expect(inputRender).toHaveBeenCalled()
     expect(inputRender.calls.length).toBe(2)
     expect(propsAtNthRender(inputRender, 1).meta.pristine).toBe(true)
     expect(propsAtNthRender(inputRender, 1).input.value).toBe('baz')
     })
     */

    it('should destroy on unmount by default', () => {
      const store = makeStore({})
      const inputRender = jest.fn(props => <input {...props.input} />)
      const formRender = jest.fn()

      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="deep.foo" component={inputRender} type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm'
      })(Form)

      class Container extends Component {
        constructor(props) {
          super(props)
          this.state = { showForm: true }
        }

        render() {
          const { showForm } = this.state
          return (
            <div>
              <Provider store={store}>
                <div>{showForm && <Decorated {...this.state} />}</div>
              </Provider>
              <button onClick={() => this.setState({ showForm: !showForm })}>Toggle</button>
            </div>
          )
        }
      }

      const dom = TestUtils.renderIntoDocument(<Container />)
      expect(store.getState()).toEqualMap(
        {
          form: {
            testForm: {
              registeredFields: {
                'deep.foo': { name: 'deep.foo', type: 'Field', count: 1 }
              }
            }
          }
        },
        'Form data in Redux did not get destroyed'
      )
      expect(formRender).toHaveBeenCalled()
      expect(formRender).toHaveBeenCalledTimes(1)

      expect(inputRender).toHaveBeenCalled()
      expect(inputRender).toHaveBeenCalledTimes(1)
      expect(propsAtNthRender(inputRender, 0).input.value).toBe('')

      // change field
      inputRender.mock.calls[0][0].input.onChange('bob')

      // form rerenders because now dirty
      expect(formRender).toHaveBeenCalledTimes(2)

      // input now has value
      expect(inputRender).toHaveBeenCalledTimes(2)
      expect(propsAtNthRender(inputRender, 1).input.value).toBe('bob')

      // check state
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            values: {
              deep: {
                foo: 'bob'
              }
            },
            registeredFields: {
              'deep.foo': { name: 'deep.foo', type: 'Field', count: 1 }
            }
          }
        }
      })

      // unmount form
      const toggle = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
      TestUtils.Simulate.click(toggle)

      // check clean state
      expect(store.getState()).toEqualMap({
        form: {}
      })

      // form still not rendered again
      expect(formRender).toHaveBeenCalledTimes(2)

      // toggle form back into existence
      TestUtils.Simulate.click(toggle)

      // form is back
      expect(formRender).toHaveBeenCalledTimes(3)

      // input is back, but without value
      expect(inputRender).toHaveBeenCalledTimes(3)
      expect(propsAtNthRender(inputRender, 2).input.value).toBe('')
    })

    it('should not destroy on unmount if told not to', () => {
      const store = makeStore({})
      const inputRender = jest.fn(props => <input {...props.input} />)
      const formRender = jest.fn()

      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="deep.foo" component={inputRender} type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm',
        destroyOnUnmount: false
      })(Form)

      class Container extends Component {
        constructor(props) {
          super(props)
          this.state = { showForm: true }
        }

        render() {
          const { showForm } = this.state
          return (
            <div>
              <Provider store={store}>
                <div>{showForm && <Decorated {...this.state} />}</div>
              </Provider>
              <button onClick={() => this.setState({ showForm: !showForm })}>Toggle</button>
            </div>
          )
        }
      }

      const dom = TestUtils.renderIntoDocument(<Container />)
      expect(store.getState()).toEqualMap(
        {
          form: {
            testForm: {
              registeredFields: {
                'deep.foo': { name: 'deep.foo', type: 'Field', count: 1 }
              }
            }
          }
        },
        'Form data in Redux did not get destroyed'
      )
      expect(formRender).toHaveBeenCalled()
      expect(formRender).toHaveBeenCalledTimes(1)

      expect(inputRender).toHaveBeenCalled()
      expect(inputRender).toHaveBeenCalledTimes(1)
      expect(propsAtNthRender(inputRender, 0).input.value).toBe('')

      // change field
      inputRender.mock.calls[0][0].input.onChange('bob')

      // form rerenders because now dirty
      expect(formRender).toHaveBeenCalledTimes(2)

      // input now has value
      expect(inputRender).toHaveBeenCalledTimes(2)
      expect(propsAtNthRender(inputRender, 1).input.value).toBe('bob')

      // check state
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            values: {
              deep: {
                foo: 'bob'
              }
            },
            registeredFields: {
              'deep.foo': { name: 'deep.foo', type: 'Field', count: 1 }
            }
          }
        }
      })

      // unmount form
      const toggle = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
      TestUtils.Simulate.click(toggle)

      // check state not destroyed
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            values: {
              deep: {
                foo: 'bob'
              }
            },
            registeredFields: {
              'deep.foo': { name: 'deep.foo', type: 'Field', count: 0 }
            }
          }
        }
      })

      // form still not rendered again
      expect(formRender).toHaveBeenCalledTimes(2)

      // toggle form back into existence
      TestUtils.Simulate.click(toggle)

      // form is back
      expect(formRender).toHaveBeenCalledTimes(3)

      // input is back, with its old value
      expect(inputRender).toHaveBeenCalledTimes(3)
      expect(propsAtNthRender(inputRender, 2).input.value).toBe('bob')
    })

    it('should keep old form values/initialValues on reinitialize if keepValues is true', () => {
      const store = makeStore({})
      const deepFooInputRender = jest.fn(props => <input {...props.input} />)
      const helloInputRender = jest.fn(props => <input {...props.input} />)
      const formRender = jest.fn()
      const initialValues1 = {
        deep: {
          foo: 'bar'
        }
      }
      const initialValues2 = {
        hello: 'world'
      }

      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="deep.foo" component={deepFooInputRender} type="text" />
              <Field name="hello" component={helloInputRender} type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm',
        enableReinitialize: true,
        keepValues: true
      })(Form)

      class Container extends Component {
        constructor(props) {
          super(props)
          this.state = { initialValues: initialValues1 }
        }

        render() {
          return (
            <div>
              <Provider store={store}>
                <Decorated {...this.state} />
              </Provider>
              <button onClick={() => this.setState({ initialValues: initialValues2 })}>Init</button>
            </div>
          )
        }
      }

      const dom = TestUtils.renderIntoDocument(<Container />)
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: {
              'deep.foo': { name: 'deep.foo', type: 'Field', count: 1 },
              hello: { name: 'hello', type: 'Field', count: 1 }
            },
            initial: initialValues1,
            values: initialValues1
          }
        }
      })
      expect(formRender).toHaveBeenCalled()
      expect(formRender).toHaveBeenCalledTimes(2)

      expect(deepFooInputRender).toHaveBeenCalled()
      expect(deepFooInputRender).toHaveBeenCalledTimes(2)

      expect(helloInputRender).toHaveBeenCalled()
      expect(helloInputRender).toHaveBeenCalledTimes(1)

      // Reinitialize the form
      const initButton = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
      TestUtils.Simulate.click(initButton)

      // check initialized state
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: {
              'deep.foo': { name: 'deep.foo', type: 'Field', count: 1 },
              hello: { name: 'hello', type: 'Field', count: 1 }
            },
            initial: {
              ...initialValues1,
              ...initialValues2
            },
            values: {
              deep: {
                foo: 'bar'
              },
              hello: 'world'
            }
          }
        }
      })

      // Expect the form not to rerender
      expect(formRender).toHaveBeenCalledTimes(2)

      // should not rerender 'deep.foo' input since its value did not change.
      expect(deepFooInputRender).toHaveBeenCalledTimes(2)

      // should rerender 'hello' input with new value and new meta.initial
      expect(helloInputRender).toHaveBeenCalledTimes(2)
    })

    it('should not keep old form values/initialValues on reinitialize if keepValues is unset/false', () => {
      const store = makeStore({})
      const deepFooInputRender = jest.fn(props => <input {...props.input} />)
      const helloInputRender = jest.fn(props => <input {...props.input} />)
      const formRender = jest.fn()
      const initialValues1 = {
        deep: {
          foo: 'bar'
        }
      }
      const initialValues2 = {
        hello: 'world'
      }

      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="deep.foo" component={deepFooInputRender} type="text" />
              <Field name="hello" component={helloInputRender} type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm',
        enableReinitialize: true,
        keepValues: false
      })(Form)

      class Container extends Component {
        constructor(props) {
          super(props)
          this.state = { initialValues: initialValues1 }
        }

        render() {
          return (
            <div>
              <Provider store={store}>
                <Decorated {...this.state} />
              </Provider>
              <button onClick={() => this.setState({ initialValues: initialValues2 })}>Init</button>
            </div>
          )
        }
      }

      const dom = TestUtils.renderIntoDocument(<Container />)
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: {
              'deep.foo': { name: 'deep.foo', type: 'Field', count: 1 },
              hello: { name: 'hello', type: 'Field', count: 1 }
            },
            initial: initialValues1,
            values: initialValues1
          }
        }
      })
      expect(formRender).toHaveBeenCalled()
      expect(formRender).toHaveBeenCalledTimes(2)

      expect(deepFooInputRender).toHaveBeenCalled()
      expect(deepFooInputRender).toHaveBeenCalledTimes(2)

      expect(helloInputRender).toHaveBeenCalled()
      expect(helloInputRender).toHaveBeenCalledTimes(1)

      // Reinitialize the form
      const initButton = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
      TestUtils.Simulate.click(initButton)

      // check initialized state
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: {
              'deep.foo': { name: 'deep.foo', type: 'Field', count: 1 },
              hello: { name: 'hello', type: 'Field', count: 1 }
            },
            initial: initialValues2,
            values: {
              hello: 'world'
            }
          }
        }
      })

      // Expect the form not to rerender
      expect(formRender).toHaveBeenCalledTimes(2)

      // should rerender 'deep.foo' input with new value and new meta.initial
      expect(deepFooInputRender).toHaveBeenCalledTimes(3)

      // should rerender 'hello' input with new value and new meta.initial
      expect(helloInputRender).toHaveBeenCalledTimes(2)
    })

    it('should keep a list of registered fields', () => {
      const store = makeStore({})
      const noopRender = () => <div />

      class Form extends Component {
        constructor() {
          super()
          this.state = { showBar: false }
        }

        render() {
          const { showBar } = this.state
          return (
            <form>
              {!showBar && <Field name="foo" component="input" type="text" />}
              {!showBar && <FieldArray name="fooArray" component={noopRender} type="text" />}
              {showBar && <Field name="bar" component="input" type="text" />}
              {showBar && <FieldArray name="barArray" component={noopRender} type="text" />}
              <button onClick={() => this.setState({ showBar: true })}>Show Bar</button>
            </form>
          )
        }
      }
      const Decorated = reduxForm({ form: 'testForm' })(Form)

      const ref = React.createRef()
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated ref={ref} />
        </Provider>
      )

      expect(ref.current.fieldList).toContainExactly(['foo', 'fooArray'])

      // switch fields
      const button = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
      TestUtils.Simulate.click(button)

      expect(ref.current.fieldList).toContainExactly(['bar', 'barArray'])
    })

    it('should keep a list of registered fields inside a FormSection', () => {
      const store = makeStore({})
      const noopRender = () => <div />

      class Form extends Component {
        constructor() {
          super()
          this.state = { showBar: false }
        }

        render() {
          const { showBar } = this.state
          return (
            <form>
              <FormSection name="sec">
                {!showBar && <Field name="foo" component="input" type="text" />}
                {!showBar && <FieldArray name="fooArray" component={noopRender} type="text" />}
                {showBar && <Field name="bar" component="input" type="text" />}
                {showBar && <FieldArray name="barArray" component={noopRender} type="text" />}
                <button onClick={() => this.setState({ showBar: true })}>Show Bar</button>
              </FormSection>
            </form>
          )
        }
      }
      const Decorated = reduxForm({ form: 'testForm' })(Form)

      const ref = React.createRef()
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated ref={ref} />
        </Provider>
      )

      expect(ref.current.fieldList).toContainExactly(['sec.foo', 'sec.fooArray'])

      // switch fields
      const button = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
      TestUtils.Simulate.click(button)

      expect(ref.current.fieldList).toContainExactly(['sec.bar', 'sec.barArray'])
    })
    it('should not set FieldArray as touched on submit', () => {
      const store = makeStore({})
      const onSubmit = jest.fn()
      const noopRender = () => <div />

      class Form extends Component {
        render() {
          const { handleSubmit } = this.props
          return (
            <form onSubmit={handleSubmit}>
              <FieldArray name="fooArray" component={noopRender} type="text" />
              <button type="submit">Submit</button>
            </form>
          )
        }
      }
      const Decorated = reduxForm({ form: 'testForm' })(Form)

      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated onSubmit={onSubmit} />
        </Provider>
      )

      const form = TestUtils.findRenderedDOMComponentWithTag(dom, 'form')
      TestUtils.Simulate.submit(form)
      expect(onSubmit).toHaveBeenCalled()
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            anyTouched: true,
            registeredFields: {
              fooArray: { name: 'fooArray', type: 'FieldArray', count: 1 }
            },
            submitSucceeded: true
          }
        }
      })
    })

    it('should provide valid/invalid/values/dirty/pristine getters', () => {
      const store = makeStore({})
      const input = jest.fn(props => <input {...props.input} />)

      const Form = () => (
        <form>
          <Field name="bar" component={input} type="text" />
        </form>
      )

      const Decorated = reduxForm({
        form: 'testForm',
        validate: values => (getIn(values, 'bar') ? {} : { bar: 'Required' })
      })(Form)

      const ref = React.createRef()
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated ref={ref} />
        </Provider>
      )

      // invalid because no value for 'bar' field
      expect(ref.current.dirty).toBe(false)
      expect(ref.current.pristine).toBe(true)
      expect(ref.current.valid).toBe(false)
      expect(ref.current.invalid).toBe(true)
      expect(ref.current.values).toEqualMap({})

      // set value for 'bar' field
      input.mock.calls[0][0].input.onChange('foo')

      // valid because we have a value for 'bar' field
      expect(ref.current.dirty).toBe(true)
      expect(ref.current.pristine).toBe(false)
      expect(ref.current.valid).toBe(true)
      expect(ref.current.invalid).toBe(false)
      expect(ref.current.values).toEqualMap({ bar: 'foo' })
    })

    it('should mark all fields as touched on submit', () => {
      const store = makeStore({
        testForm: {}
      })
      const username = jest.fn(props => <input {...props.input} type="text" />)
      const password = jest.fn(props => <input {...props.input} type="password" />)

      const Form = () => (
        <form>
          <Field name="username" component={username} type="text" />
          <Field name="password" component={password} type="text" />
        </form>
      )

      const Decorated = reduxForm({
        form: 'testForm',
        onSubmit: () => ({ _error: 'Login Failed' })
      })(Form)

      const ref = React.createRef()
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated ref={ref} />
        </Provider>
      )

      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: {
              username: { name: 'username', type: 'Field', count: 1 },
              password: { name: 'password', type: 'Field', count: 1 }
            }
          }
        }
      })

      expect(username).toHaveBeenCalled()
      expect(propsAtNthRender(username, 0).meta.touched).toBe(false)

      expect(password).toHaveBeenCalled()
      expect(propsAtNthRender(password, 0).meta.touched).toBe(false)

      expect(typeof ref.current.submit).toBe('function')
      ref.current.submit()

      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: {
              username: { name: 'username', type: 'Field', count: 1 },
              password: { name: 'password', type: 'Field', count: 1 }
            },
            anyTouched: true,
            fields: {
              username: {
                touched: true
              },
              password: {
                touched: true
              }
            },
            submitSucceeded: true
          }
        }
      })

      expect(username).toHaveBeenCalledTimes(2)
      expect(propsAtNthRender(username, 1).meta.touched).toBe(true)

      expect(password).toHaveBeenCalledTimes(2)
      expect(propsAtNthRender(password, 1).meta.touched).toBe(true)
    })

    it('should call onSubmitFail with errors if sync submit fails by throwing SubmissionError', () => {
      const store = makeStore({
        testForm: {}
      })
      const errors = { username: 'Required' }
      const onSubmitFail = jest.fn()

      const Form = () => (
        <form>
          <Field name="username" component="input" type="text" />
          <Field name="password" component="input" type="text" />
        </form>
      )

      const Decorated = reduxForm({
        form: 'testForm',
        onSubmit: () => {
          throw new SubmissionError(errors)
        },
        onSubmitFail
      })(Form)

      const ref = React.createRef()
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated ref={ref} />
        </Provider>
      )

      expect(typeof ref.current.submit).toBe('function')

      expect(onSubmitFail).not.toHaveBeenCalled()

      const caught = ref.current.submit()

      expect(onSubmitFail).toHaveBeenCalled()
      expect(onSubmitFail.mock.calls[0][0]).toEqual(errors)
      expect(onSubmitFail.mock.calls[0][1]).toEqual(store.dispatch)
      expect(onSubmitFail.mock.calls[0][2]).toBeInstanceOf(SubmissionError)
      expect(caught).toBe(errors)
    })

    it('should call onSubmitFail with undefined if sync submit fails by throwing other error', () => {
      const store = makeStore({
        testForm: {}
      })
      const onSubmitFail = jest.fn()

      const Form = () => (
        <form>
          <Field name="username" component="input" type="text" />
          <Field name="password" component="input" type="text" />
        </form>
      )

      const Decorated = reduxForm({
        form: 'testForm',
        onSubmit: () => {
          throw new Error('Some other error')
        },
        onSubmitFail
      })(Form)

      const ref = React.createRef()
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated ref={ref} />
        </Provider>
      )

      expect(typeof ref.current.submit).toBe('function')

      expect(onSubmitFail).not.toHaveBeenCalled()

      const caught = ref.current.submit()

      expect(onSubmitFail).toHaveBeenCalled()
      expect(onSubmitFail.mock.calls[0][0]).toEqual(undefined)
      expect(onSubmitFail.mock.calls[0][1]).toEqual(store.dispatch)
      expect(onSubmitFail.mock.calls[0][2]).toBeInstanceOf(Error)
      expect(caught).toBeFalsy()
    })

    it('should call onSubmitFail if async submit fails', () => {
      const store = makeStore({
        testForm: {}
      })
      const errors = { username: 'Required' }
      const onSubmitFail = jest.fn()

      const Form = () => (
        <form>
          <Field name="username" component="input" type="text" />
          <Field name="password" component="input" type="text" />
        </form>
      )

      const Decorated = reduxForm({
        form: 'testForm',
        onSubmit: () => Promise.reject(new SubmissionError(errors)),
        onSubmitFail
      })(Form)

      const ref = React.createRef()
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated ref={ref} />
        </Provider>
      )

      expect(typeof ref.current.submit).toBe('function')

      expect(onSubmitFail).not.toHaveBeenCalled()

      return ref.current.submit().then(caught => {
        expect(onSubmitFail).toHaveBeenCalled()
        expect(onSubmitFail.mock.calls[0][0]).toEqual(errors)
        expect(onSubmitFail.mock.calls[0][1]).toEqual(store.dispatch)
        expect(onSubmitFail.mock.calls[0][2]).toBeInstanceOf(SubmissionError)
        expect(caught).toBe(errors)
      })
    })

    it('should call onSubmitFail if sync validation prevents submit', () => {
      const store = makeStore({
        testForm: {}
      })
      const errors = { username: 'Required' }
      const onSubmit = jest.fn()
      const onSubmitFail = jest.fn()

      const Form = () => (
        <form>
          <Field name="username" component="input" type="text" />
          <Field name="password" component="input" type="text" />
        </form>
      )

      const Decorated = reduxForm({
        form: 'testForm',
        onSubmit,
        onSubmitFail,
        validate: () => errors
      })(Form)

      const ref = React.createRef()
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated ref={ref} />
        </Provider>
      )

      expect(typeof ref.current.submit).toBe('function')

      expect(onSubmitFail).not.toHaveBeenCalled()
      expect(onSubmit).not.toHaveBeenCalled()

      const result = ref.current.submit()
      expect(onSubmit).not.toHaveBeenCalled()
      expect(onSubmitFail).toHaveBeenCalled()
      expect(onSubmitFail.mock.calls[0][0]).toEqual(errors)
      expect(onSubmitFail.mock.calls[0][1]).toEqual(store.dispatch)
      expect(onSubmitFail.mock.calls[0][2]).toBe(null)
      expect(result).toEqual(errors)
    })

    const UsernamePasswordForm = () => (
      <form>
        <Field name="username" component="input" type="text" />
        <Field name="password" component="input" type="text" />
      </form>
    )

    const expectReadyForFirstSubmission = (submit, onSubmit, onSubmitFail) => {
      expect(typeof submit).toBe('function')

      expect(onSubmit).not.toHaveBeenCalled()
      expect(onSubmitFail).not.toHaveBeenCalled()
    }

    const expectSubmitFailedWithErrors = (onSubmit, onSubmitFail, dispatch, errors) => error => {
      expect(onSubmit).not.toHaveBeenCalled()
      expect(onSubmitFail).toHaveBeenCalled()
      expect(onSubmitFail.mock.calls[0][0]).toEqual(errors)
      expect(onSubmitFail.mock.calls[0][1]).toEqual(dispatch)
      expect(onSubmitFail.mock.calls[0][2]).toBe(null)
      expect(error).toBe(errors)
    }

    const ref = React.createRef()
    const wrappedInProvider = (TheComponent, store) => (
      <Provider store={store}>
        <TheComponent ref={ref} />
      </Provider>
    )

    const rejectPromiseWith = errors => () => Promise.reject(errors)

    const renderAndFindComponent = (TheComponent, store) => {
      TestUtils.renderIntoDocument(wrappedInProvider(TheComponent, store))

      return ref.current
    }
    const itShouldCallOnSubmitFailIfAsyncValidationPreventsSubmit = formProps => {
      const store = makeStore({
        testForm: {}
      })
      const errors = { username: 'Required' }
      const onSubmit = jest.fn()
      const onSubmitFail = jest.fn()

      const Decorated = reduxForm({
        form: 'testForm',
        asyncValidate: rejectPromiseWith(errors),
        onSubmit,
        onSubmitFail,
        ...formProps
      })(UsernamePasswordForm)

      const stub = renderAndFindComponent(Decorated, store)

      expectReadyForFirstSubmission(stub.submit, onSubmit, onSubmitFail)
      return stub
        .submit()
        .catch(expectSubmitFailedWithErrors(onSubmit, onSubmitFail, store.dispatch, errors))
    }

    it('should call onSubmitFail if async validation prevents submit', () =>
      itShouldCallOnSubmitFailIfAsyncValidationPreventsSubmit())

    it('should call onSubmitFail if async validation prevents submit with asyncChangeFields specified', () =>
      itShouldCallOnSubmitFailIfAsyncValidationPreventsSubmit({
        asyncChangeFields: ['username']
      }))

    it('should call onSubmitFail if async validation prevents submit with asyncBlurFields specified', () =>
      itShouldCallOnSubmitFailIfAsyncValidationPreventsSubmit({
        asyncBlurFields: ['username']
      }))

    it('should call onSubmitSuccess if sync submit succeeds', () => {
      const store = makeStore({
        testForm: {}
      })
      const result = { message: 'Good job!' }
      const onSubmitSuccess = jest.fn()

      const Form = () => (
        <form>
          <Field name="username" component="input" type="text" />
          <Field name="password" component="input" type="text" />
        </form>
      )

      const Decorated = reduxForm({
        form: 'testForm',
        onSubmit: () => result,
        onSubmitSuccess
      })(Form)

      const ref = React.createRef()
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated ref={ref} />
        </Provider>
      )

      expect(typeof ref.current.submit).toBe('function')

      expect(onSubmitSuccess).not.toHaveBeenCalled()

      const returned = ref.current.submit()

      expect(onSubmitSuccess).toHaveBeenCalled()
      expect(onSubmitSuccess.mock.calls[0][0]).toBe(result)
      expect(onSubmitSuccess.mock.calls[0][1]).toBe(store.dispatch)
      expect(typeof onSubmitSuccess.mock.calls[0][2]).toBe('object')
      expect(returned).toBe(result)
    })

    it('should call onSubmitSuccess if async submit succeeds', () => {
      const store = makeStore({
        testForm: {}
      })
      const result = { message: 'Good job!' }
      const onSubmitSuccess = jest.fn()

      const Form = () => (
        <form>
          <Field name="username" component="input" type="text" />
          <Field name="password" component="input" type="text" />
        </form>
      )

      const Decorated = reduxForm({
        form: 'testForm',
        onSubmit: () => Promise.resolve(result),
        onSubmitSuccess
      })(Form)

      const ref = React.createRef()
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated ref={ref} />
        </Provider>
      )

      expect(typeof ref.current.submit).toBe('function')

      expect(onSubmitSuccess).not.toHaveBeenCalled()

      return ref.current.submit().then(returned => {
        expect(onSubmitSuccess).toHaveBeenCalled()
        expect(onSubmitSuccess.mock.calls[0][0]).toBe(result)
        expect(onSubmitSuccess.mock.calls[0][1]).toBe(store.dispatch)
        expect(typeof onSubmitSuccess.mock.calls[0][2]).toBe('object')
        expect(returned).toBe(result)
      })
    })

    it('should return error thrown by sync onSubmit', () => {
      const store = makeStore({
        testForm: {}
      })
      const errors = { username: 'Required' }

      const Form = () => (
        <form>
          <Field name="username" component="input" type="text" />
          <Field name="password" component="input" type="text" />
        </form>
      )

      const Decorated = reduxForm({
        form: 'testForm',
        onSubmit: () => {
          throw new SubmissionError(errors)
        }
      })(Form)

      const ref = React.createRef()
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated ref={ref} />
        </Provider>
      )

      expect(typeof ref.current.submit).toBe('function')

      const caught = ref.current.submit()

      expect(caught).toBe(errors)
    })

    it('should submit when submit() called and onSubmit provided as config param', () => {
      const store = makeStore({
        testForm: {
          values: {
            bar: 'foo'
          }
        }
      })
      const input = jest.fn(props => <input {...props.input} />)

      const Form = () => (
        <form>
          <Field name="bar" component={input} type="text" />
        </form>
      )

      const Decorated = reduxForm({
        form: 'testForm',
        onSubmit: values => {
          expect(values).toEqualMap({ bar: 'foo' })
        }
      })(Form)

      const ref = React.createRef()
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated ref={ref} />
        </Provider>
      )

      expect(input).toHaveBeenCalled()
      expect(propsAtNthRender(input, 0).input.value).toBe('foo')

      expect(typeof ref.current.submit).toBe('function')
      ref.current.submit()
    })

    it('should submit when "submit" button is clicked and handleSubmit provided function', () => {
      const store = makeStore({
        testForm: {
          values: {
            bar: 'foo'
          }
        }
      })
      const submit = jest.fn()

      const Form = ({ handleSubmit }) => (
        <form onSubmit={handleSubmit(submit)}>
          <Field name="bar" component="textarea" />
          <input type="submit" value="Submit" />
        </form>
      )

      const Decorated = reduxForm({
        form: 'testForm'
      })(Form)

      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated />
        </Provider>
      )

      const form = TestUtils.findRenderedDOMComponentWithTag(dom, 'form')

      expect(submit).not.toHaveBeenCalled()

      TestUtils.Simulate.submit(form)

      expect(submit).toHaveBeenCalled()
    })

    it('should submit when using Form Wrapper and "submit" button is clicked with onSubmit provided as config param', () => {
      const store = makeStore({
        testForm: {
          values: {
            bar: 'foo'
          }
        }
      })

      const Form = ({ handleSubmit }) => (
        <FormWrapper onSubmit={handleSubmit}>
          <Field name="bar" component="textarea" />
          <input type="submit" value="Submit" />
        </FormWrapper>
      )

      const submit = jest.fn()
      const Decorated = reduxForm({
        form: 'testForm',
        onSubmit: submit
      })(Form)

      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated />
        </Provider>
      )

      const form = TestUtils.findRenderedDOMComponentWithTag(dom, 'form')

      expect(submit).not.toHaveBeenCalled()

      TestUtils.Simulate.submit(form)

      expect(submit).toHaveBeenCalled()

      // avoid recursive stack trace
      expect(submit.mock.calls.length).toEqual(1)
    })

    it('should no resubmit if async submit is in progress', () => {
      const store = makeStore({
        testForm: {}
      })

      const Form = () => (
        <form>
          <Field name="username" component="input" type="text" />
          <Field name="password" component="input" type="text" />
        </form>
      )

      const submitSpy = jest.fn().mockImplementation(
        () =>
          new Promise(() => {
            /* Promise will never resolve */
          })
      )

      const Decorated = reduxForm({
        form: 'testForm',
        onSubmit: submitSpy
      })(Form)

      const ref = React.createRef()
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated ref={ref} />
        </Provider>
      )

      ref.current.submit()
      ref.current.submit()

      expect(submitSpy.mock.calls.length).toEqual(1)
    })

    it('should delete submit promise when dispatching stopSubmit', () => {
      const store = makeStore({
        testForm: {}
      })

      const Form = () => (
        <form>
          <Field name="username" component="input" type="text" />
          <Field name="password" component="input" type="text" />
        </form>
      )

      const submitSpy = jest.fn().mockImplementation(
        () =>
          new Promise(() => {
            /* Promise will never resolve */
          })
      )

      const Decorated = reduxForm({
        form: 'testForm',
        onSubmit: submitSpy
      })(Form)

      const ref = React.createRef()
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated ref={ref} />
        </Provider>
      )

      ref.current.submit()
      store.dispatch(stopSubmit('testForm', {}))
      ref.current.submit()

      expect(submitSpy.mock.calls.length).toEqual(2)
    })

    it('should be fine if form is not yet in Redux store', () => {
      const store = makeStore({
        anotherForm: {
          values: {
            bar: 'foo'
          }
        }
      })
      const input = jest.fn(props => <input {...props.input} />)

      const Form = () => (
        <form>
          <Field name="foo" component={input} type="text" />
        </form>
      )

      const Decorated = reduxForm({
        form: 'testForm'
      })(Form)

      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated />
        </Provider>
      )

      expect(input).toHaveBeenCalled()
      expect(propsAtNthRender(input, 0).input.value).toBe('')
    })

    it('should be fine if getFormState returns nothing', () => {
      const store = makeStore({})
      const input = jest.fn(props => <input {...props.input} />)

      const Form = () => (
        <form>
          <Field name="foo" component={input} type="text" />
        </form>
      )

      const Decorated = reduxForm({
        form: 'testForm',
        getFormState: () => undefined
      })(Form)

      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated />
        </Provider>
      )

      expect(input).toHaveBeenCalled()
      expect(propsAtNthRender(input, 0).input.value).toBe('')
    })

    it('should throw an error when no onSubmit is specified', () => {
      const store = makeStore({
        testForm: {
          values: {
            bar: 'foo'
          }
        }
      })

      const Form = () => (
        <form>
          <Field name="bar" component="input" type="text" />
        </form>
      )

      const Decorated = reduxForm({
        form: 'testForm'
      })(Form)

      const ref = React.createRef()
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated ref={ref} />
        </Provider>
      )

      expect(() => ref.current.submit()).toThrow(/onSubmit function or pass onSubmit as a prop/)
    })

    it('should submit (with async validation) when submit() called', () => {
      const store = makeStore({
        testForm: {
          values: {
            bar: 'foo'
          }
        }
      })
      const input = jest.fn(props => <input {...props.input} />)
      const asyncValidate = jest.fn(() => Promise.resolve())

      const Form = () => (
        <form>
          <Field name="bar" component={input} type="text" />
        </form>
      )

      const Decorated = reduxForm({
        form: 'testForm',
        asyncValidate,
        onSubmit: values => {
          expect(values).toEqualMap({ bar: 'foo' })
        }
      })(Form)

      const ref = React.createRef()
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated ref={ref} />
        </Provider>
      )

      expect(input).toHaveBeenCalled()
      expect(propsAtNthRender(input, 0).input.value).toBe('foo')

      expect(asyncValidate).not.toHaveBeenCalled()

      expect(typeof ref.current.submit).toBe('function')
      ref.current.submit()

      expect(asyncValidate).toHaveBeenCalled()
      expect(propsAtNthRender(asyncValidate, 0)).toEqualMap({ bar: 'foo' })
    })

    it('should not call async validation more than once if submit is clicked fast when handleSubmit receives an event', () => {
      const store = makeStore({
        testForm: {
          values: {
            bar: 'foo'
          }
        }
      })
      const input = jest.fn(props => <input {...props.input} />)
      const asyncValidate = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
      const onSubmit = values => {
        expect(values).toEqualMap({ bar: 'foo' })
      }

      const Form = ({ handleSubmit }) => (
        <form onSubmit={handleSubmit}>
          <Field name="bar" component={input} type="text" />
        </form>
      )

      const Decorated = reduxForm({
        form: 'testForm',
        asyncValidate,
        onSubmit
      })(Form)

      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated />
        </Provider>
      )

      const form = TestUtils.findRenderedDOMComponentWithTag(dom, 'form')

      expect(input).toHaveBeenCalled()
      expect(propsAtNthRender(input, 0).input.value).toBe('foo')

      expect(asyncValidate).not.toHaveBeenCalled()

      TestUtils.Simulate.submit(form)
      TestUtils.Simulate.submit(form)
      TestUtils.Simulate.submit(form)
      TestUtils.Simulate.submit(form)
      TestUtils.Simulate.submit(form)

      expect(asyncValidate).toHaveBeenCalled()
      expect(asyncValidate).toHaveBeenCalledTimes(1)
      expect(propsAtNthRender(asyncValidate, 0)).toEqualMap({ bar: 'foo' })
    })

    it('should return rejected promise when submit is rejected', () => {
      const store = makeStore({
        testForm: {
          values: {
            bar: 'foo'
          }
        }
      })

      const Form = () => (
        <form>
          <Field name="bar" component="input" type="text" />
        </form>
      )

      const Decorated = reduxForm({
        form: 'testForm',
        onSubmit: () => Promise.reject(new SubmissionError('Rejection'))
      })(Form)

      const ref = React.createRef()
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated ref={ref} />
        </Provider>
      )

      return ref.current.submit().then(err => {
        expect(err).toBe('Rejection')
      })
    })

    it('should not call async validation more than once if submit is clicked fast when handleSubmit receives a function', () => {
      const store = makeStore({
        testForm: {
          values: {
            bar: 'foo'
          }
        }
      })
      const input = jest.fn(props => <input {...props.input} />)
      const asyncValidate = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
      const onSubmit = values => {
        expect(values).toEqualMap({ bar: 'foo' })
      }

      const Form = ({ handleSubmit }) => (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Field name="bar" component={input} type="text" />
        </form>
      )

      const Decorated = reduxForm({
        form: 'testForm',
        asyncValidate
      })(Form)

      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated />
        </Provider>
      )

      const form = TestUtils.findRenderedDOMComponentWithTag(dom, 'form')

      expect(input).toHaveBeenCalled()
      expect(propsAtNthRender(input, 0).input.value).toBe('foo')

      expect(asyncValidate).not.toHaveBeenCalled()

      TestUtils.Simulate.submit(form)
      TestUtils.Simulate.submit(form)
      TestUtils.Simulate.submit(form)
      TestUtils.Simulate.submit(form)
      TestUtils.Simulate.submit(form)

      expect(asyncValidate).toHaveBeenCalled()
      expect(asyncValidate).toHaveBeenCalledTimes(1)
      expect(propsAtNthRender(asyncValidate, 0)).toEqualMap({ bar: 'foo' })
    })

    it('should reset when reset() called', () => {
      const store = makeStore({})
      const input = jest.fn(props => <input {...props.input} />)

      const Form = () => (
        <form>
          <Field name="bar" component={input} type="text" />
        </form>
      )

      const Decorated = reduxForm({
        form: 'testForm',
        initialValues: { bar: 'initialBar' }
      })(Form)

      const ref = React.createRef()
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated ref={ref} />
        </Provider>
      )

      expect(input).toHaveBeenCalled()
      expect(input).toHaveBeenCalledTimes(2)

      expect(propsAtNthRender(input, 1).input.value).toBe('initialBar')

      input.mock.calls[1][0].input.onChange('newBar')

      expect(input).toHaveBeenCalledTimes(3)
      expect(propsAtNthRender(input, 2).input.value).toBe('newBar')

      expect(typeof ref.current.reset).toBe('function')
      ref.current.reset()

      expect(input).toHaveBeenCalledTimes(4)
      expect(propsAtNthRender(input, 3).input.value).toBe('initialBar')
    })

    it('should rerender form, but not fields, when non-redux-form props change', () => {
      const store = makeStore({})
      const inputRender = jest.fn(props => <input {...props.input} />)
      const formRender = jest.fn()

      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="deep.foo" component={inputRender} type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({ form: 'testForm' })(Form)

      class Container extends Component {
        constructor(props) {
          super(props)
          this.state = {}
        }

        render() {
          return (
            <div>
              <Provider store={store}>
                <Decorated {...this.state} />
              </Provider>
              <button onClick={() => this.setState({ someOtherProp: 42 })}>Init</button>
            </div>
          )
        }
      }

      const dom = TestUtils.renderIntoDocument(<Container />)
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: {
              'deep.foo': { name: 'deep.foo', type: 'Field', count: 1 }
            }
          }
        }
      })
      expect(formRender).toHaveBeenCalled()
      expect(formRender).toHaveBeenCalledTimes(1)
      expect(propsAtNthRender(formRender, 0).someOtherProp).toBeFalsy()

      expect(inputRender).toHaveBeenCalled()
      expect(inputRender).toHaveBeenCalledTimes(1)

      // initialize
      const initButton = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
      TestUtils.Simulate.click(initButton)

      // rerender form on prop change
      expect(formRender).toHaveBeenCalledTimes(2)
      expect(propsAtNthRender(formRender, 1).someOtherProp).toBe(42)

      // no need to rerender input
      expect(inputRender).toHaveBeenCalledTimes(1)
    })

    it('should provide error prop from sync validation', () => {
      const store = makeStore({})
      const formRender = jest.fn()

      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="foo" component="input" type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm',
        validate: () => ({ _error: 'form wide sync error' })
      })(Form)

      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated />
        </Provider>
      )

      expect(formRender).toHaveBeenCalled()
      expect(formRender).toHaveBeenCalledTimes(2)
      expect(propsAtNthRender(formRender, 1).error).toBe('form wide sync error')
    })

    it('values passed to sync validation function should be defined', () => {
      const store = makeStore({})
      const formRender = jest.fn()

      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="foo" component="input" type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm',
        enableReinitialize: true,
        initialValues: { foo: 'bar' },
        validate: values => {
          expect(values).toBeTruthy()
          return {}
        }
      })(Form)

      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated />
        </Provider>
      )

      expect(formRender).toHaveBeenCalled()
      expect(formRender).toHaveBeenCalledTimes(2)
    })

    it('should re-run sync validation when props change iff shouldValidate is overridden', () => {
      const store = makeStore({})
      const formRender = jest.fn()
      const renderInput = jest.fn(props => <input {...props.input} />)
      const validate = jest.fn((values, props) => {
        const errors = {}
        if (getIn(values, 'amount') > props.max) {
          errors.amount = `Should be <= ${props.max}`
        }
        return errors
      })
      const shouldValidate = ({ values, nextProps, props, initialRender, structure }) => {
        if (initialRender) {
          return true
        }
        return (
          initialRender ||
          !structure.deepEqual(values, nextProps.values) ||
          props.max !== nextProps.max
        ) // must specifically check prop we know might change
      }

      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="amount" component={renderInput} type="number" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm',
        initialValues: { amount: 3 },
        shouldValidate,
        validate
      })(Form)
      class Container extends Component {
        constructor() {
          super()
          this.state = { max: 5 }
        }

        render() {
          return (
            <div>
              <Decorated {...this.state} />}
              <button onClick={() => this.setState({ max: this.state.max + 1 })}>Increment</button>
            </div>
          )
        }
      }

      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Container />
        </Provider>
      )

      const validateLastCalledWith = (amount, max) => {
        expect(getIn(validate.mock.calls[validate.mock.calls.length - 1][0], 'amount')).toBe(amount)
        expect(validate.mock.calls[validate.mock.calls.length - 1][1].max).toBe(max)
      }

      expect(formRender).toHaveBeenCalled()

      // form is valid (3 < 5)
      validateLastCalledWith(3, 5)
      expect(propsAtLastRender(formRender).valid).toBe(true)

      // change amount to 6
      propsAtNthRender(renderInput, 0).input.onChange(6)

      // form is invalid (6 !<= 5)
      validateLastCalledWith(6, 5)
      expect(propsAtLastRender(formRender).valid).toBe(false)

      // increment max to 6
      const increment = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
      TestUtils.Simulate.click(increment)

      // form is valid (6 <= 6)
      validateLastCalledWith(6, 6)
      expect(propsAtLastRender(formRender).valid).toBe(true)
    })

    it('should properly remove error prop from sync validation', () => {
      const store = makeStore({})
      const input = jest.fn(props => <input {...props.input} />)
      const formRender = jest.fn()

      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="foo" component={input} type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm',
        validate: values => (getIn(values, 'foo') ? {} : { _error: 'form wide sync error' })
      })(Form)

      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated />
        </Provider>
      )

      expect(formRender).toHaveBeenCalled()
      expect(formRender).toHaveBeenCalledTimes(2)
      expect(propsAtNthRender(formRender, 1).error).toBe('form wide sync error')
      expect(propsAtNthRender(formRender, 1).valid).toBe(false)
      expect(propsAtNthRender(formRender, 1).invalid).toBe(true)

      input.mock.calls[0][0].input.onChange('bar')

      expect(formRender).toHaveBeenCalledTimes(4)
      expect(propsAtNthRender(formRender, 3).error).toBeFalsy()
      expect(propsAtNthRender(formRender, 3).valid).toBe(true)
      expect(propsAtNthRender(formRender, 3).invalid).toBe(false)
    })

    it('should allow for sync errors to be objects', () => {
      const store = makeStore({})
      const formRender = jest.fn()
      const renderInput = jest.fn(props => <input {...props.input} />)
      const error = {
        complex: 'object',
        manyKeys: true
      }

      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="foo" component={renderInput} type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm',
        validate: () => ({ foo: error })
      })(Form)

      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated />
        </Provider>
      )

      expect(formRender).toHaveBeenCalled()
      expect(formRender).toHaveBeenCalledTimes(2)
      expect(propsAtNthRender(formRender, 1).valid).toBe(false)
      expect(propsAtNthRender(formRender, 1).invalid).toBe(true)

      expect(renderInput).toHaveBeenCalled()
      expect(renderInput).toHaveBeenCalledTimes(2)
      expect(propsAtNthRender(renderInput, 1).meta.error).toEqual(error)
    })

    it('should allow sync validation for array props on push', () => {
      const store = makeStore({})
      const formRender = jest.fn()
      const inputs = [
        jest.fn(props => <input {...props.input} />),
        jest.fn(props => <input {...props.input} />),
        jest.fn(props => <input {...props.input} />)
      ]
      const renderArray = ({ fields }) => (
        <div>
          {fields.map((name, index) => (
            <Field name={name} key={index} component={inputs[index]} />
          ))}
        </div>
      )
      const validate = values => {
        const errors = { foo: [] }
        const foo = getIn(values, 'foo')
        if (foo) {
          foo.forEach((value, index) => {
            if (value < 10) {
              errors.foo[index] = 'Too low'
            }
          })
        }
        return errors
      }

      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <FieldArray name="foo" component={renderArray} />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm',
        validate
      })(Form)

      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated />
        </Provider>
      )

      expect(formRender).toHaveBeenCalled()
      expect(formRender).toHaveBeenCalledTimes(1)

      expect(inputs[0]).not.toHaveBeenCalled()
      expect(inputs[1]).not.toHaveBeenCalled()
      expect(inputs[2]).not.toHaveBeenCalled()

      propsAtNthRender(formRender, 0).array.push('foo', 3)

      // first input rendered
      expect(inputs[0]).toHaveBeenCalled()
      expect(inputs[0]).toHaveBeenCalledTimes(2)
      expect(propsAtNthRender(inputs[0], 1).meta.valid).toBe(false)
      expect(propsAtNthRender(inputs[0], 1).meta.error).toBe('Too low')
      expect(inputs[1]).not.toHaveBeenCalled()
      expect(inputs[2]).not.toHaveBeenCalled()

      // add additional value
      propsAtNthRender(formRender, 0).array.push('foo', 13)

      // first input not rendered again
      expect(inputs[0]).toHaveBeenCalledTimes(2)

      // but second input now rendered
      expect(inputs[1]).toHaveBeenCalled()
      expect(inputs[1]).toHaveBeenCalledTimes(1)
      expect(propsAtNthRender(inputs[1], 0).meta.valid).toBe(true)
      expect(propsAtNthRender(inputs[1], 0).input.value).toBe(13)
      expect(inputs[2]).not.toHaveBeenCalled()

      // fix original error
      propsAtNthRender(inputs[0], 0).input.onChange(10)

      // first input rendered again
      expect(inputs[0]).toHaveBeenCalledTimes(4)
      expect(propsAtNthRender(inputs[0], 3).meta.valid).toBe(true)
      expect(propsAtNthRender(inputs[0], 3).meta.error).toBe(undefined)
      expect(inputs[1]).toHaveBeenCalled()
      expect(inputs[2]).not.toHaveBeenCalled()
    })

    it('should provide warning prop from sync warning', () => {
      const store = makeStore({})
      const formRender = jest.fn()

      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="foo" component="input" type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm',
        warn: () => ({ _warning: 'form wide sync warning' })
      })(Form)

      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated />
        </Provider>
      )

      expect(formRender).toHaveBeenCalled()
      expect(formRender).toHaveBeenCalledTimes(2)
      expect(propsAtNthRender(formRender, 1).warning).toBe('form wide sync warning')
    })

    it('should properly remove warning prop from sync warning', () => {
      const store = makeStore({})
      const input = jest.fn(props => <input {...props.input} />)
      const formRender = jest.fn()

      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="foo" component={input} type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm',
        warn: values => (getIn(values, 'foo') ? {} : { _warning: 'form wide sync warning' })
      })(Form)

      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated />
        </Provider>
      )

      expect(formRender).toHaveBeenCalled()
      expect(formRender).toHaveBeenCalledTimes(2)
      expect(propsAtNthRender(formRender, 1).warning).toBe('form wide sync warning')

      input.mock.calls[0][0].input.onChange('bar')

      // expect(formRender.calls.length).toBe(4) // TODO: this gets called an extra time (4 instead of 3). why?
      expect(propsAtNthRender(formRender, 3).warning).toBeFalsy()
    })

    it('should allow for sync warnings to be objects', () => {
      const store = makeStore({})
      const formRender = jest.fn()
      const renderInput = jest.fn(props => <input {...props.input} />)
      const warning = {
        complex: 'object',
        manyKeys: true
      }

      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="foo" component={renderInput} type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm',
        warn: () => ({ foo: warning })
      })(Form)

      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated />
        </Provider>
      )

      expect(formRender).toHaveBeenCalled()
      // expect(formRender.calls.length).toBe(2) // TODO: This gets called only once. Why?

      expect(renderInput).toHaveBeenCalled()
      expect(renderInput).toHaveBeenCalledTimes(2)
      expect(propsAtNthRender(renderInput, 1).meta.warning).toEqual(warning)
    })

    it('should not warn with initialValues', () => {
      const store = makeStore({})
      const formRender = jest.fn()
      const renderInput = jest.fn(props => <input {...props.input} />)

      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="foo" component={renderInput} type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm',
        initialValues: { foo: 'test' },
        warn: values => (getIn(values, 'foo') ? {} : { foo: 'foo warning' })
      })(Form)

      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated />
        </Provider>
      )

      expect(propsAtLastRender(renderInput).meta.warning).not.toEqual('foo warning')
    })

    it('should call async on blur of async blur field', () => {
      const store = makeStore({})
      const inputRender = jest.fn(props => <input {...props.input} />)
      const formRender = jest.fn()
      const asyncErrors = {
        deep: {
          foo: 'async error'
        }
      }
      const asyncValidate = jest.fn().mockImplementation(() => Promise.reject(asyncErrors))

      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="deep.foo" component={inputRender} type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm',
        asyncValidate,
        asyncBlurFields: ['deep.foo'],
        asyncChangeFields: []
      })(Form)

      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated />
        </Provider>
      )
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: {
              'deep.foo': { name: 'deep.foo', type: 'Field', count: 1 }
            }
          }
        }
      })
      expect(formRender).toHaveBeenCalled()
      expect(formRender).toHaveBeenCalledTimes(1)

      expect(asyncValidate).not.toHaveBeenCalled()

      expect(inputRender).toHaveBeenCalled()
      expect(inputRender).toHaveBeenCalledTimes(1)
      expect(propsAtNthRender(inputRender, 0).meta.pristine).toBe(true)
      expect(propsAtNthRender(inputRender, 0).input.value).toBe('')
      expect(propsAtNthRender(inputRender, 0).meta.valid).toBe(true)
      expect(propsAtNthRender(inputRender, 0).meta.error).toBe(undefined)

      const inputElement = TestUtils.findRenderedDOMComponentWithTag(dom, 'input')
      TestUtils.Simulate.change(inputElement, { target: { value: 'bar' } })

      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            values: {
              deep: {
                foo: 'bar'
              }
            },
            registeredFields: {
              'deep.foo': { name: 'deep.foo', type: 'Field', count: 1 }
            }
          }
        }
      })
      expect(formRender).toHaveBeenCalledTimes(2) // rerendered because pristine -> dirty

      expect(asyncValidate).not.toHaveBeenCalled() // not yet

      expect(inputRender).toHaveBeenCalledTimes(2) // input rerendered
      expect(propsAtNthRender(inputRender, 1).meta.pristine).toBe(false)
      expect(propsAtNthRender(inputRender, 1).input.value).toBe('bar')
      expect(propsAtNthRender(inputRender, 1).meta.valid).toBe(true)
      expect(propsAtNthRender(inputRender, 1).meta.error).toBe(undefined)

      TestUtils.Simulate.blur(inputElement, { target: { value: 'bar' } })

      setTimeout(() => {
        expect(store.getState()).toEqualMap({
          form: {
            testForm: {
              anyTouched: true,
              values: {
                deep: {
                  foo: 'bar'
                }
              },
              fields: {
                deep: {
                  foo: {
                    touched: true
                  }
                }
              },
              registeredFields: {
                'deep.foo': { name: 'deep.foo', type: 'Field', count: 1 }
              },
              asyncErrors
            }
          }
        })
        // rerender form twice because of async validation start and again for valid -> invalid
        expect(formRender).toHaveBeenCalledTimes(4)

        expect(asyncValidate).toHaveBeenCalled()
        expect(propsAtNthRender(asyncValidate, 0)).toEqualMap({
          deep: { foo: 'bar' }
        })

        // input rerendered twice, at start and end of async validation
        expect(inputRender).toHaveBeenCalledTimes(4)
        expect(propsAtNthRender(inputRender, 3).meta.pristine).toBe(false)
        expect(propsAtNthRender(inputRender, 3).input.value).toBe('bar')
        expect(propsAtNthRender(inputRender, 3).meta.valid).toBe(false)
        expect(propsAtNthRender(inputRender, 3).meta.error).toBe('async error')
      })
    })

    it('should call async on change of async change field', () => {
      const store = makeStore({})
      const inputRender = jest.fn(props => <input {...props.input} />)
      const formRender = jest.fn()
      const asyncErrors = {
        deep: {
          foo: 'async error'
        }
      }
      const asyncValidate = jest.fn().mockImplementation(() => Promise.reject(asyncErrors))

      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="deep.foo" component={inputRender} type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm',
        asyncValidate,
        asyncBlurFields: [],
        asyncChangeFields: ['deep.foo']
      })(Form)

      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated />
        </Provider>
      )

      const inputElement = TestUtils.findRenderedDOMComponentWithTag(dom, 'input')

      TestUtils.Simulate.change(inputElement, { target: { value: 'bar' } })

      setTimeout(() => {
        expect(store.getState()).toEqualMap({
          form: {
            testForm: {
              anyTouched: true,
              values: {
                deep: {
                  foo: 'bar'
                }
              },
              fields: {
                deep: {
                  foo: {
                    touched: true
                  }
                }
              },
              registeredFields: {
                'deep.foo': { name: 'deep.foo', type: 'Field', count: 1 }
              },
              asyncErrors
            }
          }
        })
        // rerender form twice because of async validation start and again for valid -> invalid
        expect(formRender.calls.length).toBe(4)

        expect(asyncValidate).toHaveBeenCalled()
        expect(propsAtNthRender(asyncValidate, 0)).toEqualMap({
          deep: { foo: 'bar' }
        })

        // input rerendered twice, at start and end of async validation
        expect(inputRender.calls.length).toBe(4)
        expect(propsAtNthRender(inputRender, 3).meta.pristine).toBe(false)
        expect(propsAtNthRender(inputRender, 3).input.value).toBe('bar')
        expect(propsAtNthRender(inputRender, 3).meta.valid).toBe(false)
        expect(propsAtNthRender(inputRender, 3).meta.error).toBe('async error')
      })
    })

    it('should call form-level onChange when values change', () => {
      const store = makeStore({})
      const renderFoo = jest.fn(props => <input {...props.input} />)
      const renderBar = jest.fn(props => <input {...props.input} />)
      const onChange = jest.fn()

      class Form extends Component {
        render() {
          return (
            <form>
              <Field name="foo" component={renderFoo} type="text" />
              <Field name="bar" component={renderBar} type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm'
      })(Form)

      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated onChange={onChange} />
        </Provider>
      )

      const changeFoo = renderFoo.mock.calls[0][0].input.onChange
      const changeBar = renderBar.mock.calls[0][0].input.onChange

      expect(onChange).not.toHaveBeenCalled()

      changeFoo('dog')

      expect(onChange).toHaveBeenCalled()
      expect(onChange).toHaveBeenCalledTimes(1)

      expect(onChange.mock.calls[0][0]).toEqualMap({ foo: 'dog' })
      expect(typeof onChange.mock.calls[0][1]).toBe('function')
      expect(onChange.mock.calls[0][2].values).toEqualMap({ foo: 'dog' })
      expect(onChange.mock.calls[0][3]).toEqualMap({})

      changeBar('cat')

      expect(onChange).toHaveBeenCalledTimes(2)
      expect(onChange.mock.calls[1][0]).toEqualMap({
        foo: 'dog',
        bar: 'cat'
      })
      expect(typeof onChange.mock.calls[1][1]).toBe('function')
      expect(onChange.mock.calls[1][2].values).toEqualMap({
        foo: 'dog',
        bar: 'cat'
      })
      expect(onChange.mock.calls[1][3]).toEqualMap({
        foo: 'dog'
      })

      changeFoo('dog')

      // onChange NOT called since value did not change
      expect(onChange).toHaveBeenCalledTimes(2)

      changeFoo('doggy')
      expect(onChange).toHaveBeenCalledTimes(3)
      expect(onChange.mock.calls[2][0]).toEqualMap({
        foo: 'doggy',
        bar: 'cat'
      })
      expect(typeof onChange.mock.calls[2][1]).toBe('function')
      expect(onChange.mock.calls[2][2].values).toEqualMap({
        foo: 'doggy',
        bar: 'cat'
      })
      expect(onChange.mock.calls[2][3]).toEqualMap({
        foo: 'dog',
        bar: 'cat'
      })
    })

    it('should call form-level onChange when values change using ===', () => {
      const store = makeStore({})
      const renderFoo = jest.fn(props => <input {...props.input} />)
      const onChange = jest.fn()

      class Form extends Component {
        render() {
          return (
            <form>
              <Field name="foo" component={renderFoo} type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm'
      })(Form)

      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated onChange={onChange} />
        </Provider>
      )

      const changeFoo = renderFoo.mock.calls[0][0].input.onChange

      expect(onChange).not.toHaveBeenCalled()

      changeFoo(1)

      expect(onChange).toHaveBeenCalledTimes(1)

      changeFoo('1.')

      expect(onChange).toHaveBeenCalledTimes(2)

      changeFoo(1.2)

      expect(onChange).toHaveBeenCalledTimes(3)
    })

    it('should update sync errors after reset when using field-level validation', () => {
      const store = makeStore({})
      const renderName = jest.fn(props => <input {...props.input} />)
      const renderAge = jest.fn(props => <input {...props.input} />)
      const formRender = jest.fn()
      const onChange = jest.fn()
      const required = value => (value ? undefined : 'Required')

      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="name" component={renderName} type="text" validate={required} />
              <Field name="age" component={renderAge} type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm'
      })(Form)

      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated onChange={onChange} />
        </Provider>
      )

      // verify original state
      expect(store.getState()).toEqualMap(
        setIn(
          fromJS({
            form: {
              testForm: {
                registeredFields: {
                  name: {
                    name: 'name',
                    type: 'Field',
                    count: 1
                  },
                  age: {
                    name: 'age',
                    type: 'Field',
                    count: 1
                  }
                }
              }
            }
          }),
          'form.testForm.syncErrors',
          { name: 'Required' }
        )
      )

      // verify initial props
      expect(formRender).toHaveBeenCalled()
      expect(formRender).toHaveBeenCalledTimes(2) // initial and again with sync error

      expect(renderName).toHaveBeenCalled()
      expect(renderName).toHaveBeenCalledTimes(2) // initial and again with sync error
      expect(propsAtNthRender(renderName, 1).meta.error).toBe('Required')
      expect(propsAtNthRender(renderName, 1).input.value).toBe('')

      expect(renderAge).toHaveBeenCalled()
      expect(renderAge).toHaveBeenCalledTimes(1) // initial only
      expect(propsAtNthRender(renderAge, 0).input.value).toBe('')
      expect(propsAtNthRender(renderAge, 0).meta.pristine).toBe(true)

      // verify original state
      const originalState = setIn(
        fromJS({
          form: {
            testForm: {
              registeredFields: {
                name: {
                  name: 'name',
                  type: 'Field',
                  count: 1
                },
                age: {
                  name: 'age',
                  type: 'Field',
                  count: 1
                }
              }
            }
          }
        }),
        'form.testForm.syncErrors',
        { name: 'Required' }
      )
      expect(store.getState()).toEqualMap(originalState)

      // update age
      propsAtNthRender(renderAge, 0).input.onChange('4')

      // verify props
      expect(formRender).toHaveBeenCalledTimes(3) // again for dirty flag

      expect(renderName).toHaveBeenCalledTimes(2) // no need to rerender

      expect(renderAge).toHaveBeenCalledTimes(2) // rerendered with new value
      expect(propsAtNthRender(renderAge, 1).input.value).toBe('4')
      expect(propsAtNthRender(renderAge, 1).meta.pristine).toBe(false)

      // reset form
      propsAtNthRender(formRender, 0).reset()

      // verify that we went back to original state
      expect(store.getState()).toEqualMap(originalState)

      expect(formRender).toHaveBeenCalledTimes(5) // rerendered as pristine, and again with sync error

      expect(renderName).toHaveBeenCalledTimes(4)
      expect(propsAtNthRender(renderName, 3).meta.error).toBe('Required')
      expect(propsAtNthRender(renderName, 3).input.value).toBe('')

      expect(renderAge).toHaveBeenCalledTimes(3) // rendered again as empty and pristine
      expect(propsAtNthRender(renderAge, 2).input.value).toBe('')
      expect(propsAtNthRender(renderAge, 2).meta.pristine).toBe(true)
    })

    it('should update sync warnings after reset when using field-level validation', () => {
      const store = makeStore({})
      const renderName = jest.fn(props => <input {...props.input} />)
      const renderAge = jest.fn(props => <input {...props.input} />)
      const formRender = jest.fn()
      const onChange = jest.fn()
      const required = value => (value ? undefined : 'Required')

      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="name" component={renderName} type="text" warn={required} />
              <Field name="age" component={renderAge} type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm'
      })(Form)

      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated onChange={onChange} />
        </Provider>
      )

      // verify original state
      expect(store.getState()).toEqualMap(
        setIn(
          fromJS({
            form: {
              testForm: {
                registeredFields: {
                  name: {
                    name: 'name',
                    type: 'Field',
                    count: 1
                  },
                  age: {
                    name: 'age',
                    type: 'Field',
                    count: 1
                  }
                }
              }
            }
          }),
          'form.testForm.syncWarnings',
          { name: 'Required' }
        )
      )

      // verify initial props
      expect(formRender).toHaveBeenCalled()
      expect(formRender).toHaveBeenCalledTimes(1) // initial

      expect(renderName).toHaveBeenCalled()
      expect(renderName).toHaveBeenCalledTimes(2) // initial and again with sync warning
      expect(propsAtNthRender(renderName, 1).meta.warning).toBe('Required')
      expect(propsAtNthRender(renderName, 1).input.value).toBe('')

      expect(renderAge).toHaveBeenCalled()
      expect(renderAge).toHaveBeenCalledTimes(1) // initial only
      expect(propsAtNthRender(renderAge, 0).input.value).toBe('')
      expect(propsAtNthRender(renderAge, 0).meta.pristine).toBe(true)

      // verify original state
      const originalState = setIn(
        fromJS({
          form: {
            testForm: {
              registeredFields: {
                name: {
                  name: 'name',
                  type: 'Field',
                  count: 1
                },
                age: {
                  name: 'age',
                  type: 'Field',
                  count: 1
                }
              }
            }
          }
        }),
        'form.testForm.syncWarnings',
        { name: 'Required' }
      )
      expect(store.getState()).toEqualMap(originalState)

      // update age
      propsAtNthRender(renderAge, 0).input.onChange('4')

      // verify props
      expect(formRender).toHaveBeenCalledTimes(2) // again for dirty flag

      expect(renderName).toHaveBeenCalledTimes(2) // no need to rerender

      expect(renderAge).toHaveBeenCalledTimes(2) // rerendered with new value
      expect(propsAtNthRender(renderAge, 1).input.value).toBe('4')
      expect(propsAtNthRender(renderAge, 1).meta.pristine).toBe(false)

      // reset form
      propsAtNthRender(formRender, 0).reset()

      // verify that we went back to original state
      expect(store.getState()).toEqualMap(originalState)

      expect(formRender).toHaveBeenCalledTimes(3) // rerendered as pristine

      expect(renderName).toHaveBeenCalledTimes(4)
      expect(propsAtNthRender(renderName, 3).meta.warning).toBe('Required')
      expect(propsAtNthRender(renderName, 3).input.value).toBe('')

      expect(renderAge).toHaveBeenCalledTimes(3) // rendered again as empty and pristine
      expect(propsAtNthRender(renderAge, 2).input.value).toBe('')
      expect(propsAtNthRender(renderAge, 2).meta.pristine).toBe(true)
    })

    describe('validateIfNeeded', () => {
      it('should not call validate if shouldValidate returns false', () => {
        const validate = jest.fn().mockImplementation(() => ({}))
        const shouldValidate = jest.fn().mockImplementation(() => false)

        const Form = makeForm()
        const dom = renderForm(Form, {}, { validate, shouldValidate })

        // initial render
        expect(shouldValidate).toHaveBeenCalled()
        expect(shouldValidate.mock.calls[0][0].initialRender).toBe(true)
        expect(validate).not.toHaveBeenCalled()

        shouldValidate.mockClear()

        // on change
        const inputElement = TestUtils.findRenderedDOMComponentWithTag(dom, 'input')
        TestUtils.Simulate.change(inputElement, { target: { value: 'bar' } })

        expect(shouldValidate).toHaveBeenCalled()
        expect(shouldValidate.mock.calls[0][0].initialRender).toBe(false)
        expect(validate).not.toHaveBeenCalled()
      })

      it('should not call validate if shouldError returns false', () => {
        const validate = jest.fn().mockImplementation(() => ({}))
        const shouldError = jest.fn().mockImplementation(() => false)

        const Form = makeForm()
        const dom = renderForm(Form, {}, { validate, shouldError })

        // initial render
        expect(shouldError).toHaveBeenCalled()
        expect(shouldError.mock.calls[0][0].initialRender).toBe(true)
        expect(validate).not.toHaveBeenCalled()

        shouldError.mockClear()

        // on change
        const inputElement = TestUtils.findRenderedDOMComponentWithTag(dom, 'input')
        TestUtils.Simulate.change(inputElement, { target: { value: 'bar' } })

        expect(shouldError).toHaveBeenCalled()
        expect(shouldError.mock.calls[0][0].initialRender).toBe(false)
        expect(validate).not.toHaveBeenCalled()
      })

      it('should call validate if shouldValidate returns true', () => {
        const validate = jest.fn().mockImplementation(() => ({}))
        const shouldValidate = jest.fn().mockImplementation(() => true)

        const Form = makeForm()
        const dom = renderForm(Form, {}, { validate, shouldValidate })

        // initial render
        expect(shouldValidate).toHaveBeenCalled()
        expect(shouldValidate.mock.calls[0][0].initialRender).toBe(true)
        expect(validate).toHaveBeenCalled()

        shouldValidate.mockClear()

        // on change
        const inputElement = TestUtils.findRenderedDOMComponentWithTag(dom, 'input')
        TestUtils.Simulate.change(inputElement, { target: { value: 'bar' } })

        expect(shouldValidate).toHaveBeenCalled()
        expect(shouldValidate.mock.calls[0][0].initialRender).toBe(false)
        expect(validate).toHaveBeenCalled()
      })

      it('should call validate if shouldError returns true', () => {
        const validate = jest.fn().mockImplementation(() => ({}))
        const shouldError = jest.fn().mockImplementation(() => true)

        const Form = makeForm()
        const dom = renderForm(Form, {}, { validate, shouldError })

        // initial render
        expect(shouldError).toHaveBeenCalled()
        expect(shouldError.mock.calls[0][0].initialRender).toBe(true)
        expect(validate).toHaveBeenCalled()

        shouldError.mockClear()

        // on change
        const inputElement = TestUtils.findRenderedDOMComponentWithTag(dom, 'input')
        TestUtils.Simulate.change(inputElement, { target: { value: 'bar' } })

        expect(shouldError).toHaveBeenCalled()
        expect(shouldError.mock.calls[0][0].initialRender).toBe(false)
        expect(validate).toHaveBeenCalled()
      })

      it('should pass values and props to validate if called', () => {
        const propsSpy = jest.fn()
        const validate = jest.fn().mockImplementation(() => ({}))
        const shouldValidate = args => {
          propsSpy(args.props)
          return true
        }

        const Form = makeForm()
        const dom = renderForm(Form, {}, { validate, shouldValidate })

        validate.mockClear()

        const inputElement = TestUtils.findRenderedDOMComponentWithTag(dom, 'input')
        TestUtils.Simulate.change(inputElement, { target: { value: 'bar' } })

        // compare values
        expect(validate.mock.calls[0][0]).toEqualMap({ foo: 'bar' })

        // compare props
        const propArray = Object.keys(propsSpy.mock.calls[0][0])
        expect(Object.keys(validate.mock.calls[0][1])).toEqual(propArray)
      })

      it('should pass values and props to validate if shouldError called', () => {
        const propsSpy = jest.fn()
        const validate = jest.fn().mockImplementation(() => ({}))
        const shouldError = args => {
          propsSpy(args.props)
          return true
        }

        const Form = makeForm()
        const dom = renderForm(Form, {}, { validate, shouldError })

        validate.mockClear()

        const inputElement = TestUtils.findRenderedDOMComponentWithTag(dom, 'input')
        TestUtils.Simulate.change(inputElement, { target: { value: 'bar' } })

        // compare values
        expect(validate.mock.calls[0][0]).toEqualMap({ foo: 'bar' })

        // compare props
        const propArray = Object.keys(propsSpy.mock.calls[0][0])
        expect(Object.keys(validate.mock.calls[0][1])).toEqual(propArray)
      })
    })

    describe('warnIfNeeded', () => {
      it('should not call warn if shouldValidate returns false', () => {
        const warn = jest.fn().mockImplementation(() => ({}))
        const shouldValidate = jest.fn().mockImplementation(() => false)

        const Form = makeForm()
        const dom = renderForm(Form, {}, { warn, shouldValidate })

        // initial render
        expect(shouldValidate).toHaveBeenCalled()
        expect(shouldValidate.mock.calls[0][0].initialRender).toBe(true)
        expect(warn).not.toHaveBeenCalled()

        shouldValidate.mockClear()

        // on change
        const inputElement = TestUtils.findRenderedDOMComponentWithTag(dom, 'input')
        TestUtils.Simulate.change(inputElement, { target: { value: 'bar' } })

        expect(shouldValidate).toHaveBeenCalled()
        expect(shouldValidate.mock.calls[0][0].initialRender).toBe(false)
        expect(warn).not.toHaveBeenCalled()
      })

      it('should not call warn if shouldWarn returns false', () => {
        const warn = jest.fn().mockImplementation(() => ({}))
        const shouldWarn = jest.fn().mockImplementation(() => false)

        const Form = makeForm()
        const dom = renderForm(Form, {}, { warn, shouldWarn })

        // initial render
        expect(shouldWarn).toHaveBeenCalled()
        expect(shouldWarn.mock.calls[0][0].initialRender).toBe(true)
        expect(warn).not.toHaveBeenCalled()

        shouldWarn.mockClear()

        // on change
        const inputElement = TestUtils.findRenderedDOMComponentWithTag(dom, 'input')
        TestUtils.Simulate.change(inputElement, { target: { value: 'bar' } })

        expect(shouldWarn).toHaveBeenCalled()
        expect(shouldWarn.mock.calls[0][0].initialRender).toBe(false)
        expect(warn).not.toHaveBeenCalled()
      })

      it('should call warn if shouldValidate returns true', () => {
        const warn = jest.fn().mockImplementation(() => ({}))
        const shouldValidate = jest.fn().mockImplementation(() => true)

        const Form = makeForm()
        const dom = renderForm(Form, {}, { warn, shouldValidate })

        // initial render
        expect(shouldValidate).toHaveBeenCalled()
        expect(shouldValidate.mock.calls[0][0].initialRender).toBe(true)
        expect(warn).toHaveBeenCalled()

        shouldValidate.mockClear()

        // on change
        const inputElement = TestUtils.findRenderedDOMComponentWithTag(dom, 'input')
        TestUtils.Simulate.change(inputElement, { target: { value: 'bar' } })

        expect(shouldValidate).toHaveBeenCalled()
        expect(shouldValidate.mock.calls[0][0].initialRender).toBe(false)
        expect(warn).toHaveBeenCalled()
      })

      it('should call warn if shouldWarn returns true', () => {
        const warn = jest.fn().mockImplementation(() => ({}))
        const shouldWarn = jest.fn().mockImplementation(() => true)

        const Form = makeForm()
        const dom = renderForm(Form, {}, { warn, shouldWarn })

        // initial render
        expect(shouldWarn).toHaveBeenCalled()
        expect(shouldWarn.mock.calls[0][0].initialRender).toBe(true)
        expect(warn).toHaveBeenCalled()

        shouldWarn.mockClear()

        // on change
        const inputElement = TestUtils.findRenderedDOMComponentWithTag(dom, 'input')
        TestUtils.Simulate.change(inputElement, { target: { value: 'bar' } })

        expect(shouldWarn).toHaveBeenCalled()
        expect(shouldWarn.mock.calls[0][0].initialRender).toBe(false)
        expect(warn).toHaveBeenCalled()
      })

      it('should pass values and props to warn if called', () => {
        const propsSpy = jest.fn()
        const warn = jest.fn().mockImplementation(() => ({}))
        const shouldValidate = args => {
          propsSpy(args.props)
          return true
        }

        const Form = makeForm()
        const dom = renderForm(Form, {}, { warn, shouldValidate })

        warn.mockClear()

        const inputElement = TestUtils.findRenderedDOMComponentWithTag(dom, 'input')
        TestUtils.Simulate.change(inputElement, { target: { value: 'bar' } })

        // compare values
        expect(warn.mock.calls[0][0]).toEqualMap({ foo: 'bar' })

        // compare props
        const propArray = Object.keys(propsSpy.mock.calls[0][0])
        expect(Object.keys(warn.mock.calls[0][1])).toEqual(propArray)
      })

      it('should pass values and props to warn if shouldWarn called', () => {
        const propsSpy = jest.fn()
        const warn = jest.fn().mockImplementation(() => ({}))
        const shouldWarn = args => {
          propsSpy(args.props)
          return true
        }

        const Form = makeForm()
        const dom = renderForm(Form, {}, { warn, shouldWarn })

        warn.mockClear()

        const inputElement = TestUtils.findRenderedDOMComponentWithTag(dom, 'input')
        TestUtils.Simulate.change(inputElement, { target: { value: 'bar' } })

        // compare values
        expect(warn.mock.calls[0][0]).toEqualMap({ foo: 'bar' })

        // compare props
        const propArray = Object.keys(propsSpy.mock.calls[0][0])
        expect(Object.keys(warn.mock.calls[0][1])).toEqual(propArray)
      })
    })

    it('should not call async validate if shouldAsyncValidate returns false', () => {
      const store = makeStore({})
      const inputRender = jest.fn(props => <input {...props.input} />)
      const asyncValidate = jest.fn(() => Promise.reject({ foo: 'bad user!' }))
      const shouldAsyncValidate = jest.fn().mockImplementation(() => false)

      const Form = () => (
        <form>
          <Field name="foo" component={inputRender} type="text" />
        </form>
      )

      const Decorated = reduxForm({
        form: 'testForm',
        asyncValidate,
        asyncBlurFields: ['foo'],
        asyncChangeFields: [],
        shouldAsyncValidate
      })(Form)

      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated />
        </Provider>
      )
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: { foo: { name: 'foo', type: 'Field', count: 1 } }
          }
        }
      })

      expect(asyncValidate).not.toHaveBeenCalled()

      const inputElement = TestUtils.findRenderedDOMComponentWithTag(dom, 'input')
      TestUtils.Simulate.change(inputElement, { target: { value: 'bar' } })

      expect(shouldAsyncValidate).not.toHaveBeenCalled()

      TestUtils.Simulate.blur(inputElement, { target: { value: 'bar' } })

      expect(shouldAsyncValidate).toHaveBeenCalled()

      expect(asyncValidate).not.toHaveBeenCalled()
    })

    it('should expose wrapped instance', () => {
      const store = makeStore({})

      class Form extends Component {
        render() {
          return (
            <form>
              <Field name="foo" component="input" type="text" />
            </form>
          )
        }
      }

      const Decorated = reduxForm({
        form: 'testForm'
      })(Form)

      const ref = React.createRef()
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated ref={ref} />
        </Provider>
      )

      const wrapped = TestUtils.findRenderedComponentWithType(dom, Form)

      expect(ref.current.wrappedInstance.props).toEqual(wrapped.props)
    })

    it('should return an empty list if there are no registered fields', () => {
      const store = makeStore({})

      class Form extends Component {
        render() {
          return <form />
        }
      }

      const Decorated = reduxForm({
        form: 'testForm'
      })(Form)

      const ref = React.createRef()
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated ref={ref} />
        </Provider>
      )

      expect(ref.current.ref.current.getFieldList()).toEqual([])
    })

    it('should set autofilled and unset it on change', () => {
      const store = makeStore({})

      const renderInput = jest.fn(props => <input {...props.input} />)
      const renderForm = jest.fn()
      const onSubmit = jest.fn()
      class Form extends Component {
        render() {
          renderForm(this.props)
          return (
            <form onSubmit={this.props.handleSubmit}>
              <Field name="myField" component={renderInput} />
            </form>
          )
        }
      }

      const Decorated = reduxForm({
        form: 'testForm'
      })(Form)

      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated onSubmit={onSubmit} />
        </Provider>
      )

      expect(renderForm).toHaveBeenCalled()
      expect(renderForm).toHaveBeenCalledTimes(1)
      expect(typeof renderForm.mock.calls[0][0].autofill).toBe('function')

      // check field
      expect(renderInput).toHaveBeenCalled()
      expect(renderInput).toHaveBeenCalledTimes(1)
      expect(renderInput.mock.calls[0][0].input.value).toBe('')
      expect(renderInput.mock.calls[0][0].meta.autofilled).toBe(false)

      const form = TestUtils.findRenderedDOMComponentWithTag(dom, 'form')

      // test submit
      expect(onSubmit).not.toHaveBeenCalled()
      TestUtils.Simulate.submit(form)
      expect(onSubmit).toHaveBeenCalled()
      expect(onSubmit).toHaveBeenCalledTimes(1)
      expect(onSubmit.mock.calls[0][0]).toEqualMap({})
      expect(typeof onSubmit.mock.calls[0][1]).toBe('function')
      expect(onSubmit.mock.calls[0][2].values).toEqualMap({})
      expect(renderInput).toHaveBeenCalledTimes(2) // touched by submit

      // autofill field
      renderForm.mock.calls[0][0].autofill('myField', 'autofilled value')

      // check field
      expect(renderInput).toHaveBeenCalled()
      expect(renderInput).toHaveBeenCalledTimes(3)
      expect(renderInput.mock.calls[2][0].input.value).toBe('autofilled value')
      expect(renderInput.mock.calls[2][0].meta.autofilled).toBe(true)

      // test submitting autofilled value
      TestUtils.Simulate.submit(form)
      expect(onSubmit).toHaveBeenCalledTimes(2)
      expect(onSubmit.mock.calls[1][0]).toEqualMap({
        myField: 'autofilled value'
      })
      expect(typeof onSubmit.mock.calls[1][1]).toBe('function')
      expect(onSubmit.mock.calls[1][2].values).toEqualMap({
        myField: 'autofilled value'
      })

      // user edits field
      renderInput.mock.calls[1][0].input.onChange('user value')

      // check field
      expect(renderInput).toHaveBeenCalled()
      expect(renderInput).toHaveBeenCalledTimes(4)
      expect(renderInput.mock.calls[3][0].input.value).toBe('user value')
      expect(renderInput.mock.calls[3][0].meta.autofilled).toBe(false)

      // why not test submitting again?
      TestUtils.Simulate.submit(form)
      expect(onSubmit).toHaveBeenCalledTimes(3)
      expect(onSubmit.mock.calls[2][0]).toEqualMap({
        myField: 'user value'
      })
      expect(typeof onSubmit.mock.calls[2][1]).toBe('function')
      expect(onSubmit.mock.calls[2][2].values).toEqualMap({
        myField: 'user value'
      })
    })

    it('should not reinitialize values on remount if destroyOnMount is false', () => {
      const store = makeStore({})
      const inputRender = jest.fn(props => <input {...props.input} />)
      const initialValues = {
        foo: 'fooInitial'
      }
      class Form extends Component {
        render() {
          return (
            <form>
              <Field name="foo" component={inputRender} type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm',
        destroyOnUnmount: false
      })(Form)
      class Container extends Component {
        constructor() {
          super()
          this.state = { showForm: true }
        }

        render() {
          const { showForm } = this.state
          return (
            <div>
              {showForm && <Decorated initialValues={initialValues} />}
              <button onClick={() => this.setState({ showForm: !showForm })}>Toggle Form</button>
            </div>
          )
        }
      }

      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Container />
        </Provider>
      )

      // initialized form state
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            initial: { foo: 'fooInitial' },
            values: { foo: 'fooInitial' },
            registeredFields: { foo: { name: 'foo', type: 'Field', count: 1 } }
          }
        }
      })

      // rendered with initial value
      expect(inputRender).toHaveBeenCalled()
      expect(inputRender).toHaveBeenCalledTimes(2)
      expect(propsAtNthRender(inputRender, 1).input.value).toBe('fooInitial')

      // change value
      inputRender.mock.calls[1][0].input.onChange('fooChanged')

      // updated form state
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            initial: { foo: 'fooInitial' },
            values: { foo: 'fooChanged' },
            registeredFields: { foo: { name: 'foo', type: 'Field', count: 1 } }
          }
        }
      })

      // rendered with changed value
      expect(inputRender).toHaveBeenCalledTimes(3)
      expect(propsAtNthRender(inputRender, 2).input.value).toBe('fooChanged')

      // unmount form
      const toggle = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
      TestUtils.Simulate.click(toggle)

      // form state not destroyed (just fields unregistered)
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            initial: { foo: 'fooInitial' },
            values: { foo: 'fooChanged' },
            registeredFields: { foo: { name: 'foo', type: 'Field', count: 0 } }
          }
        }
      })

      // mount form
      TestUtils.Simulate.click(toggle)

      // form state not overwritten (fields re-registered)
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            initial: { foo: 'fooInitial' },
            values: { foo: 'fooChanged' },
            registeredFields: { foo: { name: 'foo', type: 'Field', count: 1 } }
          }
        }
      })

      // input rendered with changed value
      expect(inputRender).toHaveBeenCalledTimes(4)
      expect(propsAtNthRender(inputRender, 3).input.value).toBe('fooChanged')
    })

    it('should provide dispatch-bound blur() that modifies values', () => {
      const store = makeStore({})
      const formRender = jest.fn()

      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="foo" component="input" type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({ form: 'testForm' })(Form)

      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated />
        </Provider>
      )

      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: { foo: { name: 'foo', type: 'Field', count: 1 } }
          }
        }
      })
      expect(formRender).toHaveBeenCalled()
      expect(formRender).toHaveBeenCalledTimes(1)

      expect(typeof formRender.mock.calls[0][0].blur).toBe('function')
      formRender.mock.calls[0][0].blur('foo', 'newValue')

      // check modified state
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: { foo: { name: 'foo', type: 'Field', count: 1 } },
            values: { foo: 'newValue' },
            fields: { foo: { touched: true } },
            anyTouched: true
          }
        }
      })

      // rerendered again because now dirty
      expect(formRender).toHaveBeenCalledTimes(2)
    })

    it('should provide dispatch-bound change() that modifies values', () => {
      const store = makeStore({})
      const formRender = jest.fn()

      class Form extends Component {
        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="foo" component="input" type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({ form: 'testForm' })(Form)

      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated />
        </Provider>
      )

      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: { foo: { name: 'foo', type: 'Field', count: 1 } }
          }
        }
      })
      expect(formRender).toHaveBeenCalled()
      expect(formRender).toHaveBeenCalledTimes(1)

      expect(typeof formRender.mock.calls[0][0].change).toBe('function')
      formRender.mock.calls[0][0].change('foo', 'newValue')

      // check modified state
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: { foo: { name: 'foo', type: 'Field', count: 1 } },
            values: { foo: 'newValue' }
          }
        }
      })

      // rerendered again because now dirty
      expect(formRender).toHaveBeenCalledTimes(2)
    })

    it('startSubmit in onSubmit promise', () => {
      const store = makeStore({})
      class Form extends Component {
        render() {
          const { handleSubmit } = this.props
          return (
            <form onSubmit={handleSubmit}>
              <Field name="foo" component="input" type="text" />
            </form>
          )
        }
      }
      const resolvedProm = Promise.resolve()
      const Decorated = reduxForm({
        form: 'testForm',
        destroyOnUnmount: false,
        onSubmit(data, dispatch) {
          dispatch(startSubmit('testForm'))

          return resolvedProm
        }
      })(Form)

      const ref = React.createRef()
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated ref={ref} />
        </Provider>
      )

      // unmount form
      ref.current.submit()

      return resolvedProm.then(() => {
        // form state not destroyed (just fields unregistered)
        expect(store.getState()).toEqualMap({
          form: {
            testForm: {
              anyTouched: true,
              fields: {
                foo: {
                  touched: true
                }
              },
              registeredFields: {
                foo: { name: 'foo', type: 'Field', count: 1 }
              },
              submitSucceeded: true
            }
          }
        })
      })
    })

    it('startSubmit in onSubmit sync', () => {
      const store = makeStore({})
      class Form extends Component {
        render() {
          const { handleSubmit } = this.props
          return (
            <form onSubmit={handleSubmit}>
              <Field name="foo" component="input" type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm',
        destroyOnUnmount: false,
        onSubmit(data, dispatch) {
          dispatch(startSubmit('testForm'))
        }
      })(Form)

      const ref = React.createRef()
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated ref={ref} />
        </Provider>
      )

      // submit form
      ref.current.submit()

      // form state not destroyed (just fields unregistered)
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            anyTouched: true,
            fields: {
              foo: {
                touched: true
              }
            },
            registeredFields: {
              foo: { name: 'foo', type: 'Field', count: 1 }
            },
            submitting: true,
            submitSucceeded: true
          }
        }
      })
    })

    it('submits even if submit errors exist', () => {
      const store = makeStore({})
      let count = 0
      const onSubmit = jest.fn(
        () =>
          new Promise(resolve => {
            count++
            if (count === 1) {
              // first time throw exception
              throw new SubmissionError({ _error: 'Bad human!' })
            }
            resolve()
          })
      )
      const renderSpy = jest.fn(() => {})

      class Form extends Component {
        render() {
          const { handleSubmit, error, valid } = this.props
          renderSpy(valid, error)
          return (
            <form onSubmit={handleSubmit}>
              <Field name="foo" component="input" type="text" />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm',
        onSubmit
      })(Form)

      const ref = React.createRef()
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated ref={ref} />
        </Provider>
      )

      expect(renderSpy).toHaveBeenCalled()
      expect(renderSpy).toHaveBeenCalledTimes(1)
      expect(renderSpy.mock.calls[0][0]).toBe(true)
      expect(renderSpy.mock.calls[0][1]).toBe(undefined)
      expect(onSubmit).not.toHaveBeenCalled()

      // submit form
      return ref.current
        .submit()
        .then(() => {
          expect(onSubmit).toHaveBeenCalled()
          expect(onSubmit).toHaveBeenCalledTimes(1)

          expect(renderSpy).toHaveBeenCalledTimes(4)
          expect(renderSpy.mock.calls[3][0]).toBe(false)
          expect(renderSpy.mock.calls[3][1]).toBe('Bad human!')
        })
        .then(() => ref.current.submit()) // call submit again!
        .then(() => {
          expect(onSubmit).toHaveBeenCalledTimes(2)

          expect(renderSpy).toHaveBeenCalledTimes(7)
          expect(renderSpy.mock.calls[5][0]).toBe(true)
          expect(renderSpy.mock.calls[5][1]).toBe(undefined)
        })
    })

    it('submits (via config) when the SUBMIT action is dispatched', () => {
      const logger = jest.fn((state = {}) => state)
      const store = makeStore({}, logger)
      const inputRender = jest.fn(props => <input {...props.input} />)
      const onSubmit = jest.fn()

      class Form extends Component {
        render() {
          const { handleSubmit } = this.props
          return (
            <form onSubmit={handleSubmit}>
              <Field name="foo" component={inputRender} />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm',
        onSubmit
      })(Form)

      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated />
        </Provider>
      )

      let callIndex = logger.mock.calls.length

      // update input
      inputRender.mock.calls[0][0].input.onChange('hello')

      // check that change action was dispatched
      expect(logger.mock.calls[callIndex++][1]).toEqual(
        change('testForm', 'foo', 'hello', false, false)
      )

      // dispatch submit action
      store.dispatch(submit('testForm'))

      // check that submit action was dispatched
      expect(logger.mock.calls[callIndex++][1]).toEqual(submit('testForm'))

      // check that clear submit action was dispatched
      expect(logger.mock.calls[callIndex++][1]).toEqual(clearSubmit('testForm'))

      // check that touch action was dispatched
      expect(logger.mock.calls[callIndex++][1]).toEqual(touch('testForm', 'foo'))

      // check that submit succeeded action was dispatched
      expect(logger.mock.calls[callIndex++][1]).toEqual(setSubmitSucceeded('testForm'))

      // check no additional actions dispatched
      expect(logger).toHaveBeenCalledTimes(callIndex)

      expect(onSubmit).toHaveBeenCalled()
      expect(onSubmit).toHaveBeenCalledTimes(1)
      expect(onSubmit.mock.calls[0][0]).toEqualMap({ foo: 'hello' })
      expect(typeof onSubmit.mock.calls[0][1]).toBe('function')
      expect(onSubmit.mock.calls[0][2].values).toEqualMap({ foo: 'hello' })
    })

    it('submits (via prop) when the SUBMIT action is dispatched', () => {
      const logger = jest.fn((state = {}) => state)
      const store = makeStore({}, logger)
      const inputRender = jest.fn(props => <input {...props.input} />)
      const onSubmit = jest.fn()

      class Form extends Component {
        render() {
          const { handleSubmit } = this.props
          return (
            <form onSubmit={handleSubmit}>
              <Field name="foo" component={inputRender} />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm'
      })(Form)

      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated onSubmit={onSubmit} />
        </Provider>
      )

      let callIndex = logger.mock.calls.length

      // update input
      inputRender.mock.calls[0][0].input.onChange('hello')

      // check that change action was dispatched
      expect(logger.mock.calls[callIndex++][1]).toEqual(
        change('testForm', 'foo', 'hello', false, false)
      )

      // dispatch submit action
      store.dispatch(submit('testForm'))

      // check that submit action was dispatched
      expect(logger.mock.calls[callIndex++][1]).toEqual(submit('testForm'))

      // check that clear submit action was dispatched
      expect(logger.mock.calls[callIndex++][1]).toEqual(clearSubmit('testForm'))

      // check that touch action was dispatched
      expect(logger.mock.calls[callIndex++][1]).toEqual(touch('testForm', 'foo'))

      // check that submit succeeded action was dispatched
      expect(logger.mock.calls[callIndex++][1]).toEqual(setSubmitSucceeded('testForm'))

      // check no additional actions dispatched
      expect(logger).toHaveBeenCalledTimes(callIndex)

      expect(onSubmit).toHaveBeenCalled()
      expect(onSubmit).toHaveBeenCalledTimes(1)
      expect(onSubmit.mock.calls[0][0]).toEqualMap({ foo: 'hello' })
      expect(typeof onSubmit.mock.calls[0][1]).toBe('function')
      expect(onSubmit.mock.calls[0][2].values).toEqualMap({ foo: 'hello' })
    })

    it('does NOT submit (via config) invalid form when the SUBMIT action is dispatched', () => {
      const logger = jest.fn((state = {}) => state)
      const store = makeStore({}, logger)
      const inputRender = jest.fn(props => <input {...props.input} />)
      const onSubmit = jest.fn()
      const formRender = jest.fn()
      const validate = values => {
        const errors = {}
        if (!getIn(values, 'foo')) {
          errors.foo = 'Required'
        }
        return errors
      }

      class Form extends Component {
        render() {
          formRender(this.props)
          const { handleSubmit } = this.props
          return (
            <form onSubmit={handleSubmit}>
              <Field name="foo" component={inputRender} />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm',
        onSubmit,
        validate
      })(Form)

      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated />
        </Provider>
      )

      let callIndex = logger.mock.calls.length

      // form renders before sync validation and then again with invalid flag
      expect(formRender).toHaveBeenCalledTimes(2)
      expect(propsAtNthRender(formRender, 0).invalid).toBe(false)
      expect(propsAtNthRender(formRender, 1).invalid).toBe(true)
      expect(propsAtNthRender(formRender, 1).submitFailed).toBe(false)

      // try to submit invalid form via dispatching submit action
      store.dispatch(submit('testForm'))

      // check that submit action was dispatched
      expect(logger.mock.calls[callIndex++][1]).toEqual(submit('testForm'))

      // check that clear submit action was dispatched
      expect(logger.mock.calls[callIndex++][1]).toEqual(clearSubmit('testForm'))

      // check that touch action was dispatched
      expect(logger.mock.calls[callIndex++][1]).toEqual(touch('testForm', 'foo'))

      // check that setSubmitFailed action was dispatched
      expect(logger.mock.calls[callIndex++][1]).toEqual(setSubmitFailed('testForm', 'foo'))

      // form rerendered twice, once with submit trigger, and then after submit failure
      expect(formRender).toHaveBeenCalledTimes(4)
      expect(propsAtNthRender(formRender, 3).invalid).toBe(true)
      expect(propsAtNthRender(formRender, 3).submitFailed).toBe(true)

      // update input
      inputRender.mock.calls[0][0].input.onChange('hello')

      // check that change action was dispatched
      expect(logger.mock.calls[callIndex++][1]).toEqual(
        change('testForm', 'foo', 'hello', false, false)
      )

      // check that updateSyncErrors action was dispatched
      expect(logger.mock.calls[callIndex++][1]).toEqual(updateSyncErrors('testForm', {}))

      // rerendered once to flip dirty flag, and again to flip invalid flag
      expect(formRender).toHaveBeenCalledTimes(6)
      expect(propsAtNthRender(formRender, 3).dirty).toBe(false)
      expect(propsAtNthRender(formRender, 4).dirty).toBe(true)
      expect(propsAtNthRender(formRender, 4).invalid).toBe(true)
      expect(propsAtNthRender(formRender, 5).invalid).toBe(false)
      expect(propsAtNthRender(formRender, 5).submitFailed).toBe(true)

      // dispatch submit action on now valid form
      store.dispatch(submit('testForm'))

      // check that submit action was dispatched
      expect(logger.mock.calls[callIndex++][1]).toEqual(submit('testForm'))

      // check that clear submit action was dispatched
      expect(logger.mock.calls[callIndex++][1]).toEqual(clearSubmit('testForm'))

      // check that touch action was dispatched
      expect(logger.mock.calls[callIndex++][1]).toEqual(touch('testForm', 'foo'))

      // check that submit succeeded action was dispatched
      expect(logger.mock.calls[callIndex++][1]).toEqual(setSubmitSucceeded('testForm'))

      // check no additional actions dispatched
      expect(logger).toHaveBeenCalledTimes(callIndex)

      expect(onSubmit).toHaveBeenCalled()
      expect(onSubmit).toHaveBeenCalledTimes(1)
      expect(onSubmit.mock.calls[0][0]).toEqualMap({ foo: 'hello' })
      expect(typeof onSubmit.mock.calls[0][1]).toBe('function')
      expect(onSubmit.mock.calls[0][2].values).toEqualMap({ foo: 'hello' })
    })

    it('does NOT submit (via prop) invalid form when the SUBMIT action is dispatched', () => {
      const logger = jest.fn((state = {}) => state)
      const store = makeStore({}, logger)
      const inputRender = jest.fn(props => <input {...props.input} />)
      const formRender = jest.fn()
      const onSubmit = jest.fn()
      const validate = values => {
        const errors = {}
        if (!getIn(values, 'foo')) {
          errors.foo = 'Required'
        }
        return errors
      }

      class Form extends Component {
        render() {
          formRender(this.props)
          const { handleSubmit } = this.props
          return (
            <form onSubmit={handleSubmit}>
              <Field name="foo" component={inputRender} />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm',
        validate
      })(Form)

      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated onSubmit={onSubmit} />
        </Provider>
      )

      let callIndex = logger.mock.calls.length

      // form renders before sync validation and then again with invalid flag
      expect(formRender).toHaveBeenCalledTimes(2)
      expect(propsAtNthRender(formRender, 0).invalid).toBe(false)
      expect(propsAtNthRender(formRender, 1).invalid).toBe(true)
      expect(propsAtNthRender(formRender, 1).submitFailed).toBe(false)

      // try to submit invalid form via dispatching submit action
      store.dispatch(submit('testForm'))

      // check that submit action was dispatched
      expect(logger.mock.calls[callIndex++][1]).toEqual(submit('testForm'))

      // check that clear submit action was dispatched
      expect(logger.mock.calls[callIndex++][1]).toEqual(clearSubmit('testForm'))

      // check that touch action was dispatched
      expect(logger.mock.calls[callIndex++][1]).toEqual(touch('testForm', 'foo'))

      // check that setSubmitFailed action was dispatched
      expect(logger.mock.calls[callIndex++][1]).toEqual(setSubmitFailed('testForm', 'foo'))

      // form rerendered twice, once with submit trigger, and then after submit failure
      expect(formRender).toHaveBeenCalledTimes(4)
      expect(propsAtNthRender(formRender, 3).invalid).toBe(true)
      expect(propsAtNthRender(formRender, 3).submitFailed).toBe(true)

      // update input
      inputRender.mock.calls[0][0].input.onChange('hello')

      // check that change action was dispatched
      expect(logger.mock.calls[callIndex++][1]).toEqual(
        change('testForm', 'foo', 'hello', false, false)
      )

      // check that updateSyncErrors action was dispatched
      expect(logger.mock.calls[callIndex++][1]).toEqual(updateSyncErrors('testForm', {}))

      // rerendered once to flip dirty flag, and again to flip invalid flag
      expect(formRender).toHaveBeenCalledTimes(6)
      expect(propsAtNthRender(formRender, 3).dirty).toBe(false)
      expect(propsAtNthRender(formRender, 4).dirty).toBe(true)
      expect(propsAtNthRender(formRender, 4).invalid).toBe(true)
      expect(propsAtNthRender(formRender, 5).invalid).toBe(false)
      expect(propsAtNthRender(formRender, 5).submitFailed).toBe(true)

      // dispatch submit action on now valid form
      store.dispatch(submit('testForm'))

      // check that submit action was dispatched
      expect(logger.mock.calls[callIndex++][1]).toEqual(submit('testForm'))

      // check that clear submit action was dispatched
      expect(logger.mock.calls[callIndex++][1]).toEqual(clearSubmit('testForm'))

      // check that touch action was dispatched
      expect(logger.mock.calls[callIndex++][1]).toEqual(touch('testForm', 'foo'))

      // check that submit succeeded action was dispatched
      expect(logger.mock.calls[callIndex++][1]).toEqual(setSubmitSucceeded('testForm'))

      // check no additional actions dispatched
      expect(logger).toHaveBeenCalledTimes(callIndex)

      expect(onSubmit).toHaveBeenCalled()
      expect(onSubmit).toHaveBeenCalledTimes(1)
      expect(onSubmit.mock.calls[0][0]).toEqualMap({ foo: 'hello' })
      expect(typeof onSubmit.mock.calls[0][1]).toBe('function')
      expect(onSubmit.mock.calls[0][2].values).toEqualMap({ foo: 'hello' })
    })

    it('should allow initialize on componentWillMount with sync validation', () => {
      const logger = jest.fn((state = {}) => state)
      const store = makeStore({}, logger)
      const inputRender = jest.fn(props => <input {...props.input} />)
      const formRender = jest.fn()
      const validate = values => {
        const errors = {}
        if (!getIn(values, 'foo')) {
          errors.foo = 'Required'
        }
        return errors
      }

      class Form extends Component {
        componentDidMount() {
          this.props.initialize({ foo: 'Initialized' })
        }

        render() {
          formRender(this.props)
          return (
            <form>
              <Field name="foo" component={inputRender} />
            </form>
          )
        }
      }
      const Decorated = reduxForm({
        form: 'testForm',
        validate
      })(Form)

      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <Decorated />
        </Provider>
      )

      expect(formRender).toHaveBeenCalled()
      expect(formRender).toHaveBeenCalledTimes(3)
      expect(propsAtNthRender(formRender, 0).valid).toBe(true)
      expect(propsAtNthRender(formRender, 1).valid).toBe(false)
      expect(propsAtNthRender(formRender, 2).valid).toBe(true)
    })
  })
}

describeReduxForm('reduxForm.plain', plain, plainCombineReducers, () =>
  expect.extend(plainExpectations)
)
describeReduxForm('reduxForm.immutable', immutable, immutableCombineReducers, () =>
  expect.extend(immutableExpectations)
)
