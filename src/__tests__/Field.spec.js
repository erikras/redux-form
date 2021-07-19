/* eslint react/no-multi-comp:0 */
import React, { Component } from 'react'
import { Provider } from 'react-redux'
import { combineReducers as plainCombineReducers, createStore } from 'redux'
import { combineReducers as immutableCombineReducers } from 'redux-immutable'
import TestUtils from 'react-dom/test-utils'
import createReduxForm from '../createReduxForm'
import createReducer from '../createReducer'
import createField from '../createField'
import FormSection from '../FormSection'
import plain from '../structure/plain'
import plainExpectations from '../structure/plain/__tests__/expectations'
import immutable from '../structure/immutable'
import immutableExpectations from '../structure/immutable/__tests__/expectations'

import { dragStartMock, dropMock } from '../util/eventMocks'
import { dataKey } from '../util/eventConsts'

const testFormName = 'testForm'

const describeField = (name, structure, combineReducers, setup) => {
  const reduxForm = createReduxForm(structure)
  const Field = createField(structure)
  const reducer = createReducer(structure)
  const { fromJS, getIn } = structure
  const makeStore = initial =>
    createStore(combineReducers({ form: reducer }), fromJS({ form: initial }))

  class TestInput extends Component {
    render() {
      return <div>TEST INPUT</div>
    }
  }

  const testProps = (state, config = {}) => {
    const store = makeStore({ [testFormName]: state })
    class Form extends Component {
      render() {
        return (
          <div>
            <Field name="foo" component={TestInput} />
          </div>
        )
      }
    }
    const TestForm = reduxForm({ form: testFormName, ...config })(Form)
    const dom = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <TestForm />
      </Provider>
    )
    return TestUtils.findRenderedComponentWithType(dom, TestInput).props
  }

  describe(name, () => {
    beforeAll(() => {
      setup()
    })

    it('should throw an error if not in ReduxForm', () => {
      expect(() => {
        TestUtils.renderIntoDocument(
          <div>
            <Field name="foo" component={TestInput} />
          </div>
        )
      }).toThrow(/must be inside a component decorated with reduxForm/)
    })

    it('should throw an error if invalid component prop is provided', () => {
      const store = makeStore()
      const notAComponent = {}
      class Form extends Component {
        render() {
          return <Field component={notAComponent} />
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      expect(() => {
        TestUtils.renderIntoDocument(
          <Provider store={store}>
            <TestForm />
          </Provider>
        )
      }).toThrow(/Element type is invalid/)
    })

    it('should get value from Redux state', () => {
      const props = testProps({
        values: {
          foo: 'bar'
        }
      })
      expect(props.input.value).toBe('bar')
    })

    it('should get initial value from Redux state', () => {
      const props = testProps({
        initial: {
          foo: 'bar'
        },
        values: {
          foo: 'baz'
        }
      })
      expect(props.meta.initial).toBe('bar')
    })

    it('should get dirty/pristine from Redux state', () => {
      const props1 = testProps({
        initial: {
          foo: 'bar'
        },
        values: {
          foo: 'bar'
        }
      })
      expect(props1.meta.pristine).toBe(true)
      expect(props1.meta.dirty).toBe(false)
      const props2 = testProps({
        initial: {
          foo: 'bar'
        },
        values: {
          foo: 'baz'
        }
      })
      expect(props2.meta.pristine).toBe(false)
      expect(props2.meta.dirty).toBe(true)
      const props3 = testProps({
        initial: {
          foo: [4, 'abc', { def: null, key: [-45, '...', [0, 99]] }]
        },
        values: {
          foo: [4, 'abc', { def: null, key: [-45, '...', [0, 99]] }]
        }
      })
      expect(props3.meta.pristine).toBe(true)
      expect(props3.meta.dirty).toBe(false)
    })

    it('should allow an empty value from Redux state to be pristine', () => {
      const props1 = testProps({
        initial: {
          foo: 'bar'
        },
        values: {
          foo: ''
        }
      })
      expect(props1.meta.pristine).toBe(false)
      expect(props1.meta.dirty).toBe(true)
      const props2 = testProps({
        initial: {
          foo: ''
        },
        values: {
          foo: ''
        }
      })
      expect(props2.meta.pristine).toBe(true)
      expect(props2.meta.dirty).toBe(false)
    })

    it('should get asyncValidating from Redux state', () => {
      const props1 = testProps({
        initial: {
          foo: 'bar'
        },
        values: {
          foo: 'bar'
        },
        asyncValidating: 'dog'
      })
      expect(props1.meta.asyncValidating).toBe(false)
      const props2 = testProps({
        initial: {
          foo: 'bar'
        },
        values: {
          foo: 'baz'
        },
        asyncValidating: 'foo'
      })
      expect(props2.meta.asyncValidating).toBe(true)
    })

    it('should get active from Redux state', () => {
      const props1 = testProps({
        values: {
          foo: 'bar'
        }
      })
      expect(props1.meta.active).toBe(false)
      const props2 = testProps({
        values: {
          foo: 'bar'
        },
        fields: {
          foo: {
            active: true
          }
        }
      })
      expect(props2.meta.active).toBe(true)
    })

    it('should get autofilled from Redux state', () => {
      const props1 = testProps({
        values: {
          foo: 'bar'
        }
      })
      expect(props1.meta.autofilled).toBe(false)
      const props2 = testProps({
        values: {
          foo: 'bar'
        },
        fields: {
          foo: {
            autofilled: true
          }
        }
      })
      expect(props2.meta.autofilled).toBe(true)
    })

    it('should get touched from Redux state', () => {
      const props1 = testProps({
        values: {
          foo: 'bar'
        }
      })
      expect(props1.meta.touched).toBe(false)
      const props2 = testProps({
        values: {
          foo: 'bar'
        },
        fields: {
          foo: {
            touched: true
          }
        }
      })
      expect(props2.meta.touched).toBe(true)
    })

    it('should get visited from Redux state', () => {
      const props1 = testProps({
        values: {
          foo: 'bar'
        }
      })
      expect(props1.meta.visited).toBe(false)
      const props2 = testProps({
        values: {
          foo: 'bar'
        },
        fields: {
          foo: {
            visited: true
          }
        }
      })
      expect(props2.meta.visited).toBe(true)
    })

    it('should pass in the form name as meta.form', () => {
      const props = testProps()
      expect(props.meta.form).toBe(testFormName)
    })

    it('should get sync errors from outer reduxForm component', () => {
      const props = testProps(
        {
          initial: {
            foo: 'bar'
          },
          values: {
            foo: 'bar'
          },
          registeredFields: {
            foo: { name: 'foo', type: 'Field' }
          }
        },
        {
          validate: () => ({ foo: 'foo error' })
        }
      )
      expect(props.meta.error).toBe('foo error')
    })

    it('should get sync warnings from outer reduxForm component', () => {
      const props = testProps(
        {
          initial: {
            foo: 'bar'
          },
          values: {
            foo: 'bar'
          },
          registeredFields: {
            foo: { name: 'foo', type: 'Field' }
          }
        },
        {
          warn: () => ({ foo: 'foo warning' })
        }
      )
      expect(props.meta.warning).toBe('foo warning')
    })

    it('should get async errors from Redux state', () => {
      const props = testProps({
        initial: {
          foo: 'bar'
        },
        values: {
          foo: 'bar'
        },
        asyncErrors: {
          foo: 'foo error'
        }
      })
      expect(props.meta.error).toBe('foo error')
    })

    it('should get submit errors from Redux state', () => {
      const props = testProps({
        initial: {
          foo: 'bar'
        },
        values: {
          foo: 'bar'
        },
        submitErrors: {
          foo: 'foo error'
        }
      })
      expect(props.meta.error).toBe('foo error')
    })

    it('should get submitFailed prop from Redux state', () => {
      const props = testProps({
        submitFailed: true
      })
      expect(props.meta.submitFailed).toBe(true)
    })

    it('should provide meta.dispatch', () => {
      const props = testProps({})
      expect(typeof props.meta.dispatch).toBe('function')
    })

    it('should provide name getter', () => {
      const store = makeStore({
        testForm: {
          values: {
            foo: 'bar'
          }
        }
      })
      const ref = React.createRef()
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="foo" component={TestInput} ref={ref} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )
      expect(ref.current.name).toBe('foo')
    })

    it('should provide value getter', () => {
      const store = makeStore({
        testForm: {
          values: {
            foo: 'bar'
          }
        }
      })
      const ref = React.createRef()
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="foo" component={TestInput} ref={ref} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )
      expect(ref.current.value).toBe('bar')
    })

    it('should provide dirty getter that is true when dirty', () => {
      const store = makeStore({
        testForm: {
          values: {
            foo: 'bar'
          }
        }
      })
      const ref = React.createRef()
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="foo" component={TestInput} ref={ref} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )
      expect(ref.current.dirty).toBe(true)
    })

    it('should provide dirty getter that is false when pristine', () => {
      const store = makeStore({
        testForm: {
          initial: {
            foo: 'bar'
          },
          values: {
            foo: 'bar'
          }
        }
      })
      const ref = React.createRef()
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="foo" component={TestInput} ref={ref} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )
      expect(ref.current.dirty).toBe(false)
    })

    it('should provide pristine getter that is false when dirty', () => {
      const store = makeStore({
        testForm: {
          values: {
            foo: 'bar'
          }
        }
      })
      const ref = React.createRef()
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="foo" component={TestInput} ref={ref} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )
      expect(ref.current.pristine).toBe(false)
    })

    it('should provide pristine getter that is true when pristine', () => {
      const store = makeStore({
        testForm: {
          initial: {
            foo: 'bar'
          },
          values: {
            foo: 'bar'
          }
        }
      })
      const ref = React.createRef()
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="foo" component={TestInput} ref={ref} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )
      expect(ref.current.pristine).toBe(true)
    })

    it('should have value set to initial value on first render', () => {
      const store = makeStore({})
      const input = jest.fn(props => <input {...props.input} />)
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="foo" component={input} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({
        form: 'testForm'
      })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm initialValues={{ foo: 'bar' }} />
        </Provider>
      )
      expect(input).toHaveBeenCalled()
      expect(input).toHaveBeenCalledTimes(2)
      expect(input.mock.calls[1][0].input.value).toBe('bar')
    })

    it('should validate with initial value when initialValue is provided', () => {
      const store = makeStore({})
      const input = jest.fn(props => <input {...props.input} />)
      const required = jest.fn(value => {
        console.trace('required', value)
        return value == null ? 'Required' : undefined
      })
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="foo" value="test" component={input} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({
        form: 'testForm',
        validate: required
      })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm initialValues={{ foo: 'bar' }} />
        </Provider>
      )
      expect(input).toHaveBeenCalled()
      expect(input).toHaveBeenCalledTimes(2)

      // call validate only once with initial value
      expect(required).toHaveBeenCalled()
      expect(required).toHaveBeenCalledTimes(1)
      expect(required.mock.calls[0][0]).toEqualMap({ foo: 'bar' })
      expect(input.mock.calls[1][0].meta.error).toBeFalsy()
    })

    it('should provide sync error for array field', () => {
      const store = makeStore({
        testForm: {
          values: {
            foo: ['bar']
          }
        }
      })
      const input = jest.fn(props => <input {...props.input} />)
      const validate = () => ({ foo: ['bar error'] })
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="foo[0]" component={input} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({
        form: 'testForm',
        validate
      })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )
      expect(input).toHaveBeenCalled()
      expect(input).toHaveBeenCalledTimes(2)
      expect(input.mock.calls[1][0].meta.valid).toBe(false)
      expect(input.mock.calls[1][0].meta.error).toBe('bar error')
    })

    it('should provide sync warning for array field', () => {
      const store = makeStore({
        testForm: {
          values: {
            foo: ['bar']
          }
        }
      })
      const input = jest.fn(props => <input {...props.input} />)
      const warn = () => ({ foo: ['bar warning'] })
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="foo[0]" component={input} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({
        form: 'testForm',
        warn
      })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )
      expect(input).toHaveBeenCalled()
      expect(input).toHaveBeenCalledTimes(2)
      expect(input.mock.calls[1][0].meta.warning).toBe('bar warning')
    })

    it('should provide access to rendered component', () => {
      const store = makeStore({
        testForm: {
          values: {
            foo: 'bar'
          }
        }
      })
      const ref = React.createRef()
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="foo" component={TestInput} forwardRef ref={ref} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )
      const field = ref.current
      const input = TestUtils.findRenderedComponentWithType(dom, TestInput)

      expect(field.getRenderedComponent()).toBe(input)
    })

    it('should reconnect when name changes', () => {
      const store = makeStore({
        testForm: {
          values: {
            foo: 'fooValue',
            bar: 'barValue'
          },
          fields: {
            bar: {
              touched: true
            }
          }
        }
      })
      const input = jest.fn(props => <input {...props.input} />)
      class Form extends Component {
        constructor() {
          super()
          this.state = { field: 'foo' }
        }

        render() {
          return (
            <div>
              <Field name={this.state.field} component={input} />
              <button onClick={() => this.setState({ field: 'bar' })}>Change</button>
            </div>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )
      expect(input).toHaveBeenCalled()
      expect(input).toHaveBeenCalledTimes(1)
      expect(input.mock.calls[0][0].input.value).toBe('fooValue')
      expect(input.mock.calls[0][0].meta.touched).toBe(false)

      const button = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
      TestUtils.Simulate.click(button)

      expect(input).toHaveBeenCalledTimes(2)
      expect(input.mock.calls[1][0].input.value).toBe('barValue')
      expect(input.mock.calls[1][0].meta.touched).toBe(true)
    })

    it('should prefix name getter when inside FormSection', () => {
      const store = makeStore()
      const ref = React.createRef()
      class Form extends Component {
        render() {
          return (
            <FormSection name="foo" component="span">
              <Field name="bar" component="input" ref={ref} />
            </FormSection>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )
      expect(ref.current.name).toBe('foo.bar')
    })
    it('should prefix name getter when inside multiple FormSection', () => {
      const store = makeStore()
      const ref = React.createRef()
      class Form extends Component {
        render() {
          return (
            <FormSection name="foo">
              <FormSection name="fighter">
                <Field name="bar" component="input" ref={ref} />
              </FormSection>
            </FormSection>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )
      expect(ref.current.name).toBe('foo.fighter.bar')
    })

    it('should prefix name when inside FormSection', () => {
      const store = makeStore()
      class Form extends Component {
        render() {
          return (
            <FormSection name="foo" component="span">
              <Field name="bar" component="input" />
            </FormSection>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: {
              'foo.bar': { name: 'foo.bar', type: 'Field', count: 1 }
            }
          }
        }
      })
    })

    it('should prefix name when inside multiple FormSections', () => {
      const store = makeStore()
      class Form extends Component {
        render() {
          return (
            <FormSection name="foo">
              <FormSection name="fighter">
                <Field name="bar" component="input" />
              </FormSection>
            </FormSection>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: {
              'foo.fighter.bar': {
                name: 'foo.fighter.bar',
                type: 'Field',
                count: 1
              }
            }
          }
        }
      })
    })

    it('should re-register when name changes', () => {
      const store = makeStore()
      class Form extends Component {
        constructor() {
          super()
          this.state = { field: 'foo' }
        }

        render() {
          return (
            <div>
              <Field name={this.state.field} component="input" />
              <button onClick={() => this.setState({ field: 'bar' })}>Change</button>
            </div>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: { foo: { name: 'foo', type: 'Field', count: 1 } }
          }
        }
      })

      const button = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
      TestUtils.Simulate.click(button)

      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: { bar: { name: 'bar', type: 'Field', count: 1 } }
          }
        }
      })
    })

    it('should rerender when props change', () => {
      const store = makeStore()
      const input = jest.fn(props => (
        <div>
          {props.highlighted}
          <input {...props.input} />
        </div>
      ))
      class Form extends Component {
        constructor() {
          super()
          this.state = { highlighted: 0 }
        }

        render() {
          const { highlighted } = this.state
          return (
            <div>
              <Field name="foo" highlighted={highlighted} component={input} />
              <button onClick={() => this.setState({ highlighted: highlighted + 1 })}>
                Change
              </button>
            </div>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )
      expect(input).toHaveBeenCalled()
      expect(input).toHaveBeenCalledTimes(1)
      expect(input.mock.calls[0][0].highlighted).toBe(0)

      const button = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
      TestUtils.Simulate.click(button)

      expect(input).toHaveBeenCalledTimes(2)
      expect(input.mock.calls[1][0].highlighted).toBe(1)
    })

    it('should NOT rerender when props.props is shallow-equal, but !==', () => {
      const store = makeStore()
      const input = jest.fn(props => <input {...props.input} />)
      const renderSpy = jest.fn()
      class Form extends Component {
        constructor() {
          super()
          this.state = { foo: 'bar' }
        }

        render() {
          renderSpy()
          return (
            <div>
              <Field name="myField" component={input} props={{ rel: 'test' }} />
              <button onClick={() => this.setState({ foo: 'qux' })}>Change</button>
            </div>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )
      expect(renderSpy).toHaveBeenCalled()
      expect(renderSpy).toHaveBeenCalledTimes(1)

      expect(input).toHaveBeenCalled()
      expect(input).toHaveBeenCalledTimes(1)
      expect(input.mock.calls[0][0].rel).toBe('test')

      const button = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
      TestUtils.Simulate.click(button)

      expect(renderSpy).toHaveBeenCalledTimes(2)

      expect(input).toHaveBeenCalledTimes(1)
    })

    it('should call normalize function on change', () => {
      const store = makeStore({
        testForm: {
          values: {
            title: 'Redux Form',
            author: 'Erik Rasmussen',
            username: 'oldusername'
          }
        }
      })
      const renderUsername = jest.fn(props => <input {...props.input} />)
      const normalize = jest.fn(value => value.toLowerCase())
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="title" component="input" />
              <Field name="author" component="input" />
              <Field name="username" component={renderUsername} normalize={normalize} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      expect(normalize).not.toHaveBeenCalled()

      expect(renderUsername.mock.calls[0][0].input.value).toBe('oldusername')
      renderUsername.mock.calls[0][0].input.onChange('ERIKRAS')

      expect(normalize).toHaveBeenCalledWith(
        'ERIKRAS',
        'oldusername',
        fromJS({
          title: 'Redux Form',
          author: 'Erik Rasmussen',
          username: 'ERIKRAS'
        }),
        fromJS({
          title: 'Redux Form',
          author: 'Erik Rasmussen',
          username: 'oldusername'
        }),
        'username'
      )
      expect(normalize).toHaveBeenCalledTimes(1)

      expect(renderUsername.mock.calls[1][0].input.value).toBe('erikras')
    })

    it('should call normalize function on blur', () => {
      const store = makeStore({
        testForm: {
          values: {
            title: 'Redux Form',
            author: 'Erik Rasmussen',
            username: 'oldusername'
          }
        }
      })
      const renderUsername = jest.fn(props => <input {...props.input} />)
      const normalize = jest.fn(value => value.toLowerCase())
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="title" component="input" />
              <Field name="author" component="input" />
              <Field name="username" component={renderUsername} normalize={normalize} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      expect(normalize).not.toHaveBeenCalled()

      expect(renderUsername.mock.calls[0][0].input.value).toBe('oldusername')
      renderUsername.mock.calls[0][0].input.onBlur('ERIKRAS')

      expect(normalize).toHaveBeenCalledWith(
        'ERIKRAS',
        'oldusername',
        fromJS({
          title: 'Redux Form',
          author: 'Erik Rasmussen',
          username: 'ERIKRAS'
        }),
        fromJS({
          title: 'Redux Form',
          author: 'Erik Rasmussen',
          username: 'oldusername'
        }),
        'username'
      )
      expect(normalize).toHaveBeenCalledTimes(1)

      expect(renderUsername.mock.calls[1][0].input.value).toBe('erikras')
    })

    it('should call asyncValidate function on blur', () => {
      const store = makeStore({
        testForm: {
          values: {
            title: 'Redux Form',
            author: 'Erik Rasmussen',
            username: 'oldusername'
          }
        }
      })
      const renderUsername = jest.fn(props => <input {...props.input} />)
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="title" component="input" />
              <Field name="author" component="input" />
              <Field name="username" component={renderUsername} />
            </div>
          )
        }
      }
      const asyncValidate = jest.fn(() => new Promise(resolve => resolve()))
      const TestForm = reduxForm({ form: 'testForm', asyncValidate })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      renderUsername.mock.calls[0][0].input.onBlur('ERIKRAS')

      expect(asyncValidate).toHaveBeenCalled()
    })

    it('should call asyncValidate function on change', () => {
      const store = makeStore({
        testForm: {
          values: {
            title: 'Redux Form',
            author: 'Erik Rasmussen',
            username: 'oldusername'
          }
        }
      })
      const renderUsername = jest.fn(props => <input {...props.input} />)
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="title" component="input" />
              <Field name="author" component="input" />
              <Field name="username" component={renderUsername} />
            </div>
          )
        }
      }
      const asyncValidate = jest.fn(() => new Promise(resolve => resolve()))
      const TestForm = reduxForm({ form: 'testForm', asyncValidate })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      renderUsername.mock.calls[0][0].input.onChange('ERIKRAS')

      expect(asyncValidate).toHaveBeenCalled()
    })

    it('should call asyncValidate function on blur if field is specified', () => {
      const store = makeStore({
        testForm: {
          values: {
            title: 'Redux Form',
            author: 'Erik Rasmussen',
            username: 'oldusername'
          }
        }
      })
      const renderUsername = jest.fn(props => <input {...props.input} />)
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="title" component="input" />
              <Field name="author" component="input" />
              <Field name="username" component={renderUsername} />
            </div>
          )
        }
      }
      const asyncValidate = jest.fn(() => new Promise(resolve => resolve()))
      const TestForm = reduxForm({
        form: 'testForm',
        asyncValidate,
        asyncBlurFields: ['username']
      })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      renderUsername.mock.calls[0][0].input.onBlur('ERIKRAS')

      expect(asyncValidate).toHaveBeenCalled()
    })

    it('should call asyncValidate function on change if field is specified', () => {
      const store = makeStore({
        testForm: {
          values: {
            title: 'Redux Form',
            author: 'Erik Rasmussen',
            username: 'oldusername'
          }
        }
      })
      const renderUsername = jest.fn(props => <input {...props.input} />)
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="title" component="input" />
              <Field name="author" component="input" />
              <Field name="username" component={renderUsername} />
            </div>
          )
        }
      }
      const asyncValidate = jest.fn(() => new Promise(resolve => resolve()))
      const TestForm = reduxForm({
        form: 'testForm',
        asyncValidate,
        asyncChangeFields: ['username']
      })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      renderUsername.mock.calls[0][0].input.onChange('ERIKRAS')

      expect(asyncValidate).toHaveBeenCalled()
    })

    it('should not call asyncValidate function on blur if field is specified and different', () => {
      const store = makeStore({
        testForm: {
          values: {
            title: 'Redux Form',
            author: 'Erik Rasmussen',
            username: 'oldusername'
          }
        }
      })
      const renderUsername = jest.fn(props => <input {...props.input} />)
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="title" component="input" />
              <Field name="author" component="input" />
              <Field name="username" component={renderUsername} />
            </div>
          )
        }
      }
      const asyncValidate = jest.fn(() => new Promise(resolve => resolve()))
      const TestForm = reduxForm({
        form: 'testForm',
        asyncValidate,
        asyncBlurFields: ['author']
      })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      renderUsername.mock.calls[0][0].input.onBlur('ERIKRAS')

      expect(asyncValidate).not.toHaveBeenCalled()
    })

    it('should not call asyncValidate function on change if field is specified and different', () => {
      const store = makeStore({
        testForm: {
          values: {
            title: 'Redux Form',
            author: 'Erik Rasmussen',
            username: 'oldusername'
          }
        }
      })
      const renderUsername = jest.fn(props => <input {...props.input} />)
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="title" component="input" />
              <Field name="author" component="input" />
              <Field name="username" component={renderUsername} />
            </div>
          )
        }
      }
      const asyncValidate = jest.fn(() => new Promise(resolve => resolve()))
      const TestForm = reduxForm({
        form: 'testForm',
        asyncValidate,
        asyncChangeFields: ['author']
      })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      renderUsername.mock.calls[0][0].input.onChange('ERIKRAS')

      expect(asyncValidate).not.toHaveBeenCalled()
    })

    it('should not call asyncValidate function on change if field is specified as onBlur', () => {
      const store = makeStore({
        testForm: {
          values: {
            title: 'Redux Form',
            author: 'Erik Rasmussen',
            username: 'oldusername'
          }
        }
      })
      const renderUsername = jest.fn(props => <input {...props.input} />)
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="title" component="input" />
              <Field name="author" component="input" />
              <Field name="username" component={renderUsername} />
            </div>
          )
        }
      }
      const asyncValidate = jest.fn(() => new Promise(resolve => resolve()))
      const TestForm = reduxForm({
        form: 'testForm',
        asyncValidate,
        asyncBlurFields: ['username']
      })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      renderUsername.mock.calls[0][0].input.onChange('ERIKRAS')

      expect(asyncValidate).not.toHaveBeenCalled()
    })

    it('should not call asyncValidate function on blur if field is specified as onChange', () => {
      const store = makeStore({
        testForm: {
          values: {
            title: 'Redux Form',
            author: 'Erik Rasmussen',
            username: 'oldusername'
          }
        }
      })
      const renderUsername = jest.fn(props => <input {...props.input} />)
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="title" component="input" />
              <Field name="author" component="input" />
              <Field name="username" component={renderUsername} />
            </div>
          )
        }
      }
      const asyncValidate = jest.fn(() => new Promise(resolve => resolve()))
      const TestForm = reduxForm({
        form: 'testForm',
        asyncValidate,
        asyncChangeFields: ['username']
      })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      renderUsername.mock.calls[0][0].input.onBlur('ERIKRAS')

      expect(asyncValidate).not.toHaveBeenCalled()
    })

    it('should call handle on focus', () => {
      const store = makeStore({
        testForm: {
          values: {
            title: 'Redux Form'
          }
        }
      })
      const renderTitle = jest.fn(props => <input {...props.input} />)
      class Form extends Component {
        render() {
          return <Field name="title" component={renderTitle} />
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      expect(renderTitle.mock.calls[0][0].meta.visited).toBe(false)
      renderTitle.mock.calls[0][0].input.onFocus()
      expect(renderTitle.mock.calls[1][0].meta.visited).toBe(true)
    })

    it('should not change the value of a radio when blur', () => {
      const store = makeStore({
        testForm: {
          values: {
            title: 'Redux Form',
            author: 'Erik Rasmussen',
            sex: 'male'
          }
        }
      })
      const renderSex = jest.fn(props => <input {...props.input} />)
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="title" component="input" />
              <Field name="author" component="input" />
              <Field name="sex" value="female" type="radio" component={renderSex} />
              <Field name="sex" value="male" type="radio" component={renderSex} />
              <Field name="sex" value="other" type="radio" component={renderSex} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      expect(renderSex.mock.calls[0][0].input.checked).toBe(false)
      expect(renderSex.mock.calls[1][0].input.checked).toBe(true)
      renderSex.mock.calls[0][0].input.onBlur('female')

      expect(renderSex.mock.calls[2][0].input.checked).toBe(false)
      expect(renderSex.mock.calls[3][0].input.checked).toBe(false)
      expect(renderSex.mock.calls[4][0].input.checked).toBe(true)
    })

    it('should call handle on drag start with value', () => {
      const store = makeStore({
        testForm: {
          values: {
            title: 'Redux Form'
          }
        }
      })
      const renderTitle = jest.fn(props => <input {...props.input} />)
      const dragSpy = jest.fn((key, val) => val)
      const event = dragStartMock(dragSpy)
      class Form extends Component {
        render() {
          return <Field name="title" component={renderTitle} />
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      expect(dragSpy).not.toHaveBeenCalled()
      renderTitle.mock.calls[0][0].input.onDragStart(event)
      expect(dragSpy).toHaveBeenCalledWith(dataKey, 'Redux Form')
    })

    it('should call handle on drag start without value', () => {
      const store = makeStore({
        testForm: {
          values: {
            title: null
          }
        }
      })
      const renderTitle = jest.fn(props => <input {...props.input} />)
      const dragSpy = jest.fn((key, val) => val)
      const event = dragStartMock(dragSpy)
      class Form extends Component {
        render() {
          return <Field name="title" component={renderTitle} />
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      expect(dragSpy).not.toHaveBeenCalled()
      renderTitle.mock.calls[0][0].input.onDragStart(event)
      expect(dragSpy).toHaveBeenCalledWith(dataKey, '')
    })

    it('should call handle on drop', () => {
      const store = makeStore({
        testForm: {
          values: {
            title: 'Redux Form'
          }
        }
      })
      const renderTitle = jest.fn(props => <input {...props.input} />)
      const dropSpy = jest.fn(key => key)
      const event = dropMock(dropSpy)
      event.preventDefault = jest.fn(event.preventDefault)
      class Form extends Component {
        render() {
          return <Field name="title" component={renderTitle} />
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      expect(dropSpy).not.toHaveBeenCalled()
      renderTitle.mock.calls[0][0].input.onDrop(event)
      expect(event.preventDefault).toHaveBeenCalled()
      expect(dropSpy).toHaveBeenCalledWith(dataKey)
    })

    it('should call format function on first render', () => {
      const store = makeStore({
        testForm: {
          values: {
            name: 'Redux Form'
          }
        }
      })
      const input = jest.fn(props => <input {...props.input} />)
      const format = jest.fn(value => value.toLowerCase())
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="name" component={input} format={format} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      expect(format).toHaveBeenCalled()
      expect(format).toHaveBeenCalledTimes(1)
      expect(format.mock.calls[0]).toEqual(['Redux Form', 'name'])

      expect(input.mock.calls[0][0].input.value).toBe('redux form')
    })

    it('should call parse function on change', () => {
      const store = makeStore({
        testForm: {
          values: {
            name: 'redux form'
          }
        }
      })
      const input = jest.fn(props => <input {...props.input} />)
      const parse = jest.fn(value => value.toLowerCase())
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="name" component={input} parse={parse} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      expect(parse).not.toHaveBeenCalled()

      expect(input).toHaveBeenCalledTimes(1)
      expect(input.mock.calls[0][0].input.value).toBe('redux form')

      input.mock.calls[0][0].input.onChange('REDUX FORM ROCKS')

      expect(parse).toHaveBeenCalled()
      expect(parse).toHaveBeenCalledTimes(1)
      expect(parse.mock.calls[0]).toEqual(['REDUX FORM ROCKS', 'name'])

      expect(input).toHaveBeenCalledTimes(2)
      expect(input.mock.calls[1][0].input.value).toBe('redux form rocks')
    })

    it('should call parse function on blur', () => {
      const store = makeStore({
        testForm: {
          values: {
            name: 'redux form'
          }
        }
      })
      const input = jest.fn(props => <input {...props.input} />)
      const parse = jest.fn(value => value.toLowerCase())
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="name" component={input} parse={parse} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      expect(parse).not.toHaveBeenCalled()

      expect(input).toHaveBeenCalledTimes(1)
      expect(input.mock.calls[0][0].input.value).toBe('redux form')

      input.mock.calls[0][0].input.onBlur('REDUX FORM ROCKS')

      expect(parse).toHaveBeenCalled()
      expect(parse).toHaveBeenCalledTimes(1)
      expect(parse.mock.calls[0]).toEqual(['REDUX FORM ROCKS', 'name'])

      expect(input).toHaveBeenCalledTimes(2)
      expect(input.mock.calls[1][0].input.value).toBe('redux form rocks')
    })

    it('should not update a value if onBlur is passed undefined', () => {
      const store = makeStore({
        testForm: {
          values: {
            name: 'redux form'
          }
        }
      })
      const input = jest.fn(props => <input {...props.input} />)
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="name" component={input} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      // verify state
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            values: {
              name: 'redux form'
            },
            registeredFields: {
              name: {
                name: 'name',
                type: 'Field',
                count: 1
              }
            }
          }
        }
      })

      // verify props
      expect(input).toHaveBeenCalled()
      expect(input).toHaveBeenCalledTimes(1)
      expect(input.mock.calls[0][0].meta.active).toBe(false)
      expect(input.mock.calls[0][0].input.value).toBe('redux form')

      // call onFocus
      input.mock.calls[0][0].input.onFocus()

      // verify state
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            active: 'name',
            values: {
              name: 'redux form'
            },
            registeredFields: {
              name: {
                name: 'name',
                type: 'Field',
                count: 1
              }
            },
            fields: {
              name: {
                visited: true,
                active: true
              }
            }
          }
        }
      })

      // verify props
      expect(input).toHaveBeenCalledTimes(2) // active now
      expect(input.mock.calls[1][0].meta.active).toBe(true)
      expect(input.mock.calls[1][0].input.value).toBe('redux form')

      // call onBlur
      input.mock.calls[0][0].input.onBlur()

      // verify state
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            anyTouched: true,
            values: {
              name: 'redux form' // UNCHANGED!
            },
            registeredFields: {
              name: {
                name: 'name',
                type: 'Field',
                count: 1
              }
            },
            fields: {
              name: {
                visited: true,
                touched: true
              }
            }
          }
        }
      })

      // verify props
      expect(input).toHaveBeenCalledTimes(3) // not active now
      expect(input.mock.calls[2][0].meta.active).toBe(false)
      expect(input.mock.calls[2][0].input.value).toBe('redux form') // UNCHANGED!
    })

    it('should parse and format to maintain different type in store', () => {
      const store = makeStore({
        testForm: {
          values: {
            age: 42
          }
        }
      })
      const input = jest.fn(props => <input {...props.input} />)
      const parse = jest.fn(value => value && parseInt(value, 10))
      const format = jest.fn(value => value && value.toString())
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="age" component={input} format={format} parse={parse} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      // format called once
      expect(format).toHaveBeenCalled()
      expect(format).toHaveBeenCalledTimes(1)

      // parse not called yet
      expect(parse).not.toHaveBeenCalled()

      // input displaying string value
      expect(input).toHaveBeenCalledTimes(1)
      expect(input.mock.calls[0][0].input.value).toBe('42')

      // update value
      input.mock.calls[0][0].input.onChange('15')

      // parse was called
      expect(parse).toHaveBeenCalled()
      expect(parse).toHaveBeenCalledTimes(1)
      expect(parse.mock.calls[0]).toEqual(['15', 'age'])

      // value in store is number
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            values: {
              age: 15 // number
            },
            registeredFields: { age: { name: 'age', type: 'Field', count: 1 } }
          }
        }
      })

      // format called again
      expect(format).toHaveBeenCalled()
      expect(format).toHaveBeenCalledTimes(2)
      expect(format.mock.calls[1]).toEqual([15, 'age'])

      // input rerendered with string value
      expect(input).toHaveBeenCalledTimes(2)
      expect(input.mock.calls[1][0].input.value).toBe('15')
    })

    it('should rerender when sync error changes', () => {
      const store = makeStore({
        testForm: {
          values: {
            password: 'redux-form sucks',
            confirm: 'redux-form rocks'
          }
        }
      })
      const passwordInput = jest.fn(props => <input {...props.input} />)
      const confirmInput = jest.fn(props => <input {...props.input} />)
      const validate = values => {
        const password = getIn(values, 'password')
        const confirm = getIn(values, 'confirm')
        return password === confirm ? {} : { confirm: 'Must match!' }
      }
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="password" component={passwordInput} />
              <Field name="confirm" component={confirmInput} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({
        form: 'testForm',
        validate
      })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      // password input rendered
      expect(passwordInput).toHaveBeenCalled()
      expect(passwordInput).toHaveBeenCalledTimes(1)

      // confirm input rendered with error
      expect(confirmInput).toHaveBeenCalled()
      expect(confirmInput).toHaveBeenCalledTimes(2)
      expect(confirmInput.mock.calls[1][0].meta.valid).toBe(false)
      expect(confirmInput.mock.calls[1][0].meta.error).toBe('Must match!')

      // update password field so that they match
      passwordInput.mock.calls[0][0].input.onChange('redux-form rocks')

      // password input rerendered
      expect(passwordInput).toHaveBeenCalledTimes(2)

      // confirm input should also rerender, but with no error
      expect(confirmInput).toHaveBeenCalledTimes(3)
      expect(confirmInput.mock.calls[2][0].meta.valid).toBe(true)
      expect(confirmInput.mock.calls[2][0].meta.error).toBe(undefined)
    })

    it('should rerender when sync error is cleared', () => {
      const store = makeStore()
      const usernameInput = jest.fn(props => <input {...props.input} />)
      const validate = values => {
        const username = getIn(values, 'username')
        return username ? {} : { username: 'Required' }
      }
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="username" component={usernameInput} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({
        form: 'testForm',
        validate
      })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      // username input rendered
      expect(usernameInput).toHaveBeenCalled()
      expect(usernameInput).toHaveBeenCalledTimes(2)

      // username field has error
      expect(usernameInput.mock.calls[1][0].meta.valid).toBe(false)
      expect(usernameInput.mock.calls[1][0].meta.error).toBe('Required')

      // update username field so it passes
      usernameInput.mock.calls[1][0].input.onChange('erikras')

      // username input rerendered
      expect(usernameInput).toHaveBeenCalledTimes(4)

      // should be valid now
      expect(usernameInput.mock.calls[3][0].meta.valid).toBe(true)
      expect(usernameInput.mock.calls[3][0].meta.error).toBe(undefined)
    })

    it('should rerender when sync warning changes', () => {
      const store = makeStore({
        testForm: {
          values: {
            password: 'redux-form sucks',
            confirm: 'redux-form rocks'
          }
        }
      })
      const passwordInput = jest.fn(props => <input {...props.input} />)
      const confirmInput = jest.fn(props => <input {...props.input} />)
      const warn = values => {
        const password = getIn(values, 'password')
        const confirm = getIn(values, 'confirm')
        return password === confirm ? {} : { confirm: 'Should match. Or not. Whatever.' }
      }
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="password" component={passwordInput} />
              <Field name="confirm" component={confirmInput} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({
        form: 'testForm',
        warn
      })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      // password input rendered
      expect(passwordInput).toHaveBeenCalled()
      expect(passwordInput).toHaveBeenCalledTimes(1)

      // confirm input rendered with warning
      expect(confirmInput).toHaveBeenCalled()
      expect(confirmInput).toHaveBeenCalledTimes(2)
      expect(confirmInput.mock.calls[1][0].meta.warning).toBe('Should match. Or not. Whatever.')

      // update password field so that they match
      passwordInput.mock.calls[0][0].input.onChange('redux-form rocks')

      // password input rerendered
      expect(passwordInput).toHaveBeenCalledTimes(2)

      // confirm input should also rerender, but with no warning
      expect(confirmInput).toHaveBeenCalledTimes(3)
      expect(confirmInput.mock.calls[2][0].meta.warning).toBe(undefined)
    })

    it('should rerender when sync warning is cleared', () => {
      const store = makeStore()
      const usernameInput = jest.fn(props => <input {...props.input} />)
      const warn = values => {
        const username = getIn(values, 'username')
        return username ? {} : { username: 'Recommended' }
      }
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="username" component={usernameInput} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({
        form: 'testForm',
        warn
      })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      // username input rendered
      expect(usernameInput).toHaveBeenCalled()
      expect(usernameInput).toHaveBeenCalledTimes(2)

      // username field has warning
      expect(usernameInput.mock.calls[1][0].meta.warning).toBe('Recommended')

      // update username field so it passes
      usernameInput.mock.calls[1][0].input.onChange('erikras')

      // username input rerendered
      expect(usernameInput).toHaveBeenCalledTimes(4)

      // should be valid now
      expect(usernameInput.mock.calls[3][0].meta.warning).toBe(undefined)
    })

    it('should sync validate with field level validator', () => {
      const store = makeStore()
      const usernameInput = jest.fn(props => <input {...props.input} />)
      const required = jest.fn(value => (value == null ? 'Required' : undefined))
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="username" component={usernameInput} validate={required} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({
        form: 'testForm'
      })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      // username input rendered
      expect(usernameInput).toHaveBeenCalled()
      expect(usernameInput).toHaveBeenCalledTimes(2)
      expect(required).toHaveBeenCalled()
      expect(required).toHaveBeenCalledTimes(1)

      // username field has error
      expect(usernameInput.mock.calls[1][0].meta.valid).toBe(false)
      expect(usernameInput.mock.calls[1][0].meta.error).toBe('Required')

      // update username field so it passes
      usernameInput.mock.calls[0][0].input.onChange('erikras')

      // username input rerendered
      expect(usernameInput).toHaveBeenCalledTimes(4)

      // should be valid now
      expect(usernameInput.mock.calls[3][0].meta.valid).toBe(true)
      expect(usernameInput.mock.calls[3][0].meta.error).toBe(undefined)
    })

    it('should sync validate with multiple field level validators', () => {
      const store = makeStore()
      const usernameInput = jest.fn(props => <input {...props.input} />)
      const required = jest.fn(value => (value == null ? 'Required' : undefined))
      const minLength5 = jest.fn(value => (value && value.length < 5 ? 'Min length 5' : undefined))
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="username" component={usernameInput} validate={[required, minLength5]} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({
        form: 'testForm'
      })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      // username input rendered
      expect(usernameInput).toHaveBeenCalled()
      expect(usernameInput).toHaveBeenCalledTimes(2)
      expect(required).toHaveBeenCalled()
      expect(required).toHaveBeenCalledTimes(1)

      // username field has error
      expect(usernameInput.mock.calls[1][0].meta.valid).toBe(false)
      expect(usernameInput.mock.calls[1][0].meta.error).toBe('Required')

      // update username field so it fails min length 5
      usernameInput.mock.calls[0][0].input.onChange('erik')

      // username input rerendered
      expect(usernameInput).toHaveBeenCalledTimes(4)

      // should be valid now
      expect(usernameInput.mock.calls[3][0].meta.valid).toBe(false)
      expect(usernameInput.mock.calls[3][0].meta.error).toBe('Min length 5')

      // update username field so it passes
      usernameInput.mock.calls[0][0].input.onChange('erikasa')

      // username input rerendered
      expect(usernameInput).toHaveBeenCalledTimes(6)

      // should be valid now
      expect(usernameInput.mock.calls[5][0].meta.valid).toBe(true)
      expect(usernameInput.mock.calls[5][0].meta.error).toBe(undefined)
    })

    it('should update field level validation when validate prop changes', () => {
      const store = makeStore()
      const usernameInput = jest.fn(props => <input {...props.input} />)
      const required = jest.fn(value => (value == null ? 'Required' : undefined))
      class Form extends Component {
        constructor() {
          super()
          this.state = { validate: undefined }
        }

        render() {
          return (
            <div>
              <Field name="username" component={usernameInput} validate={this.state.validate} />
              <button onClick={() => this.setState({ validate: required })}>Change</button>
            </div>
          )
        }
      }
      const TestForm = reduxForm({
        form: 'testForm'
      })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      // username field is ok
      expect(usernameInput.mock.calls[usernameInput.mock.calls.length - 1][0].meta.valid).toBe(true)

      // update validate prop
      const button = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
      TestUtils.Simulate.click(button)

      // should be invalid now
      expect(usernameInput.mock.calls[usernameInput.mock.calls.length - 1][0].meta.valid).toBe(
        false
      )
      expect(usernameInput.mock.calls[usernameInput.mock.calls.length - 1][0].meta.error).toBe(
        'Required'
      )
    })

    it('should revalidate when Field unregisters and registers with new validate prop', () => {
      const weightFieldName = 'weight'
      const weightValue = 100
      const initialWeightLimit = 20
      const nextWeightLimit = 50
      const store = makeStore({
        testForm: {
          values: {
            weight: weightValue
          }
        }
      })
      const renderWeight = jest.fn(props => <input {...props.input} />)
      const weightValidationText = 'Max allowed weight is '
      const getWeightLimitValidator = weightLimit =>
        jest.fn(value => (value > weightLimit ? weightValidationText + weightLimit : undefined))
      class Form extends Component {
        constructor() {
          super()
          this.state = {
            weightLimit: initialWeightLimit,
            validate: [getWeightLimitValidator(initialWeightLimit)]
          }
        }

        render() {
          // This will trigger unregister and register Field
          // and these must happen in correct order for Field validation to work
          const someCrazyBusinessLogic = this.state.weightLimit > 30
          return (
            <div>
              {someCrazyBusinessLogic && (
                <Field
                  name={weightFieldName}
                  component={renderWeight}
                  validate={this.state.validate}
                />
              )}
              {!someCrazyBusinessLogic && (
                <Field
                  name={weightFieldName}
                  component={renderWeight}
                  validate={this.state.validate}
                />
              )}
              <button
                onClick={() =>
                  this.setState({
                    weightLimit: nextWeightLimit,
                    validate: [getWeightLimitValidator(nextWeightLimit)]
                  })
                }
              >
                Change weight limit
              </button>
            </div>
          )
        }
      }
      const TestForm = reduxForm({ form: testFormName })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      testWeightValidator(initialWeightLimit)
      const changeWeightLimit = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
      TestUtils.Simulate.click(changeWeightLimit)
      testWeightValidator(nextWeightLimit)

      function testWeightValidator(weightLimit) {
        expect(renderWeight.mock.calls[renderWeight.mock.calls.length - 1][0].meta.valid).toBe(
          false
        )
        expect(renderWeight.mock.calls[renderWeight.mock.calls.length - 1][0].meta.error).toBe(
          weightValidationText + weightLimit
        )
      }
    })

    it('should sync warn with field level warning function', () => {
      const store = makeStore()
      const usernameInput = jest.fn(props => <input {...props.input} />)
      const required = jest.fn(value => (value == null ? 'Recommended' : undefined))
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="username" component={usernameInput} warn={required} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({
        form: 'testForm'
      })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      // username input rendered
      expect(usernameInput).toHaveBeenCalled()
      expect(usernameInput).toHaveBeenCalledTimes(2)
      expect(required).toHaveBeenCalled()
      expect(required).toHaveBeenCalledTimes(1)

      // username field has warning
      expect(usernameInput.mock.calls[1][0].meta.valid).toBe(true)
      expect(usernameInput.mock.calls[1][0].meta.warning).toBe('Recommended')

      // update username field so it passes
      usernameInput.mock.calls[0][0].input.onChange('erikras')

      // username input rerendered
      expect(usernameInput).toHaveBeenCalledTimes(4)

      // should be valid now
      expect(usernameInput.mock.calls[3][0].meta.valid).toBe(true)
      expect(usernameInput.mock.calls[3][0].meta.warning).toBe(undefined)
    })

    it('should update field level warning when warn prop changes', () => {
      const store = makeStore()
      const usernameInput = jest.fn(props => <input {...props.input} />)
      const required = jest.fn(value => (value == null ? 'Required' : undefined))
      class Form extends Component {
        constructor() {
          super()
          this.state = { warn: undefined }
        }

        render() {
          return (
            <div>
              <Field name="username" component={usernameInput} warn={this.state.warn} />
              <button onClick={() => this.setState({ warn: required })}>Change</button>
            </div>
          )
        }
      }
      const TestForm = reduxForm({
        form: 'testForm'
      })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      // username field is ok
      expect(usernameInput.mock.calls[usernameInput.mock.calls.length - 1][0].meta.warning).toBe(
        undefined
      )

      // update warn prop
      const button = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
      TestUtils.Simulate.click(button)

      // should have warning now
      expect(usernameInput.mock.calls[usernameInput.mock.calls.length - 1][0].meta.warning).toBe(
        'Required'
      )
    })

    it('should not generate any warnings by passing api props into custom', () => {
      const store = makeStore()
      const renderSpy = jest.fn()
      class InputComponent extends Component {
        render() {
          renderSpy(this.props)
          return <input {...this.props.input} />
        }
      }
      const apiProps = {
        // all the official API props you can pass to Field
        component: InputComponent,
        name: 'foo',
        normalize: x => x,
        parse: x => x,
        props: {},
        format: x => x,
        validate: () => undefined,
        warn: () => undefined,
        forwardRef: true,
        immutableProps: []
      }
      class Form extends Component {
        render() {
          return (
            <div>
              <Field {...apiProps} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({
        form: 'testForm'
      })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      expect(renderSpy).toHaveBeenCalled()
      const props = renderSpy.mock.calls[0][0]
      Object.keys(apiProps).forEach(key => expect(props[key]).toBeFalsy())
    })

    it('should only rerender field that has changed', () => {
      const store = makeStore()
      const input1 = jest.fn(props => <input {...props.input} />)
      const input2 = jest.fn(props => <input {...props.input} />)
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="input1" component={input1} />
              <Field name="input2" component={input2} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )
      expect(input1).toHaveBeenCalled()
      expect(input1).toHaveBeenCalledTimes(1)
      expect(input1.mock.calls[0][0].input.value).toBe('')

      expect(input2).toHaveBeenCalled()
      expect(input2).toHaveBeenCalledTimes(1)
      expect(input2.mock.calls[0][0].input.value).toBe('')

      // change input #1
      input1.mock.calls[0][0].input.onChange('foo')

      // expect input #1 to have been rerendered
      expect(input1).toHaveBeenCalledTimes(2)
      expect(input1.mock.calls[1][0].input.value).toBe('foo')

      // expect input #2 to NOT have been rerendered
      expect(input2).toHaveBeenCalledTimes(1)
    })

    it('should allow onChange callback', () => {
      const store = makeStore()
      const renderInput = jest.fn(props => <input {...props.input} />)
      const callback = jest.fn()
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="foo" component={renderInput} onChange={callback} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      const input = TestUtils.findRenderedDOMComponentWithTag(dom, 'input')
      input.value = 'bar'

      expect(callback).not.toHaveBeenCalled()

      // rendered once with no onChange prop passed down in custom props
      expect(renderInput).toHaveBeenCalledTimes(1)
      expect(renderInput.mock.calls[0][0].onChange).toBeFalsy()

      TestUtils.Simulate.change(input)

      // call back was called
      expect(callback).toHaveBeenCalled()
      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback.mock.calls[0][0]).toBeTruthy() // event
      expect(callback.mock.calls[0][1]).toBe('bar')
      expect(callback.mock.calls[0][2]).toBe(undefined)
      expect(callback.mock.calls[0][3]).toBe('foo')

      // value changed
      expect(renderInput).toHaveBeenCalledTimes(2)
      expect(renderInput.mock.calls[1][0].input.value).toBe('bar')
    })

    it('should allow onChange callback to prevent change', () => {
      const store = makeStore()
      const renderInput = jest.fn(props => <input {...props.input} />)
      const callback = jest.fn(event => event.preventDefault())
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="foo" component={renderInput} onChange={callback} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      const input = TestUtils.findRenderedDOMComponentWithTag(dom, 'input')
      input.value = 'bar'

      expect(callback).not.toHaveBeenCalled()

      // rendered once with no onChange prop passed down in custom props
      expect(renderInput).toHaveBeenCalledTimes(1)
      expect(renderInput.mock.calls[0][0].onChange).toBeFalsy()

      TestUtils.Simulate.change(input)

      // call back was called
      expect(callback).toHaveBeenCalled()
      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback.mock.calls[0][0]).toBeTruthy()
      expect(callback.mock.calls[0][1]).toBe('bar')
      expect(callback.mock.calls[0][2]).toBe(undefined)
      expect(callback.mock.calls[0][3]).toBe('foo')

      // value NOT changed
      expect(renderInput).toHaveBeenCalledTimes(1)
      expect(renderInput.mock.calls[0][0].input.value).toBe('')
    })

    it('should allow onBlur callback', () => {
      const store = makeStore()
      const renderInput = jest.fn(props => <input {...props.input} />)
      const callback = jest.fn()
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="foo" component={renderInput} onBlur={callback} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      const input = TestUtils.findRenderedDOMComponentWithTag(dom, 'input')
      input.value = 'bar'

      expect(callback).not.toHaveBeenCalled()

      // rendered once with no onBlur prop passed down in custom props
      expect(renderInput).toHaveBeenCalledTimes(1)
      expect(renderInput.mock.calls[0][0].onBlur).toBeFalsy()

      TestUtils.Simulate.blur(input)

      // call back was called
      expect(callback).toHaveBeenCalled()
      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback.mock.calls[0][0]).toBeTruthy() // event
      expect(callback.mock.calls[0][1]).toBe('bar')
      expect(callback.mock.calls[0][2]).toBe(undefined)
      expect(callback.mock.calls[0][3]).toBe('foo')

      // value changed
      expect(renderInput).toHaveBeenCalledTimes(2)
      expect(renderInput.mock.calls[1][0].input.value).toBe('bar')
    })

    it('should allow onBlur callback to prevent blur', () => {
      const store = makeStore()
      const renderInput = jest.fn(props => <input {...props.input} />)
      const callback = jest.fn(event => event.preventDefault())
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="foo" component={renderInput} onBlur={callback} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      const input = TestUtils.findRenderedDOMComponentWithTag(dom, 'input')
      input.value = 'bar'

      expect(callback).not.toHaveBeenCalled()

      // rendered once with no onBlur prop passed down in custom props
      expect(renderInput).toHaveBeenCalledTimes(1)
      expect(renderInput.mock.calls[0][0].onBlur).toBeFalsy()

      TestUtils.Simulate.blur(input)

      // call back was called
      expect(callback).toHaveBeenCalled()
      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback.mock.calls[0][0]).toBeTruthy()
      expect(callback.mock.calls[0][1]).toBe('bar')
      expect(callback.mock.calls[0][2]).toBe(undefined)
      expect(callback.mock.calls[0][3]).toBe('foo')

      // value NOT changed
      expect(renderInput).toHaveBeenCalledTimes(1)
      expect(renderInput.mock.calls[0][0].input.value).toBe('')
    })

    it('should allow onFocus callback', () => {
      const store = makeStore()
      const renderInput = jest.fn(props => <input {...props.input} />)
      const callback = jest.fn()
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="foo" component={renderInput} onFocus={callback} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      const input = TestUtils.findRenderedDOMComponentWithTag(dom, 'input')

      expect(callback).not.toHaveBeenCalled()

      // rendered once with no onFocus prop passed down in custom props
      expect(renderInput).toHaveBeenCalledTimes(1)
      expect(renderInput.mock.calls[0][0].onFocus).toBeFalsy()

      // not marked as active
      expect(renderInput.mock.calls[0][0].meta.active).toBe(false)

      TestUtils.Simulate.focus(input)

      // call back was called
      expect(callback).toHaveBeenCalled()
      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback.mock.calls[0][0]).toBeTruthy() // event
      expect(callback.mock.calls[0][1]).toBe('foo')

      // field marked active
      expect(renderInput).toHaveBeenCalledTimes(2)
      expect(renderInput.mock.calls[1][0].meta.active).toBe(true)
    })

    it('should allow onFocus callback to prevent focus', () => {
      const store = makeStore()
      const renderInput = jest.fn(props => <input {...props.input} />)
      const callback = jest.fn(event => event.preventDefault())
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="foo" component={renderInput} onFocus={callback} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      const input = TestUtils.findRenderedDOMComponentWithTag(dom, 'input')

      expect(callback).not.toHaveBeenCalled()

      // rendered once with no onFocus prop passed down in custom props
      expect(renderInput).toHaveBeenCalledTimes(1)
      expect(renderInput.mock.calls[0][0].onFocus).toBeFalsy()

      // not marked as active
      expect(renderInput.mock.calls[0][0].meta.active).toBe(false)

      TestUtils.Simulate.focus(input)

      // call back was called
      expect(callback).toHaveBeenCalled()
      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback.mock.calls[0][0]).toBeTruthy()
      expect(callback.mock.calls[0][1]).toBe('foo')

      // field NOT marked active
      expect(renderInput).toHaveBeenCalledTimes(1)
      expect(renderInput.mock.calls[0][0].meta.active).toBe(false)
    })

    it('should allow onDrop callback', () => {
      const store = makeStore()
      const renderInput = jest.fn(props => <input {...props.input} />)
      const callback = jest.fn()
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="foo" component={renderInput} onDrop={callback} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      const input = TestUtils.findRenderedDOMComponentWithTag(dom, 'input')

      expect(callback).not.toHaveBeenCalled()

      // rendered once with no onDrop prop passed down in custom props
      expect(renderInput).toHaveBeenCalledTimes(1)
      expect(renderInput.mock.calls[0][0].onDrop).toBeFalsy()

      TestUtils.Simulate.drop(input, {
        dataTransfer: { getData: () => 'bar' }
      })

      // call back was called
      expect(callback).toHaveBeenCalled()
      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback.mock.calls[0][0]).toBeTruthy() // event
      expect(callback.mock.calls[0][1]).toBe('bar')
      expect(callback.mock.calls[0][2]).toBe(undefined)
      expect(callback.mock.calls[0][3]).toBe('foo')

      // value changed
      expect(renderInput).toHaveBeenCalledTimes(2)
      expect(renderInput.mock.calls[1][0].input.value).toBe('bar')
    })

    it('should allow onDrop callback to prevent drop', () => {
      const store = makeStore()
      const renderInput = jest.fn(props => <input {...props.input} />)
      const callback = jest.fn(event => event.preventDefault())
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="foo" component={renderInput} onDrop={callback} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      const input = TestUtils.findRenderedDOMComponentWithTag(dom, 'input')
      input.value = 'bar'

      expect(callback).not.toHaveBeenCalled()

      // rendered once with no onDrop prop passed down in custom props
      expect(renderInput).toHaveBeenCalledTimes(1)
      expect(renderInput.mock.calls[0][0].onDrop).toBeFalsy()

      TestUtils.Simulate.drop(input, {
        dataTransfer: { getData: () => 'bar' }
      })

      // call back was called
      expect(callback).toHaveBeenCalled()
      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback.mock.calls[0][0]).toBeTruthy()
      expect(callback.mock.calls[0][1]).toBe('bar')
      expect(callback.mock.calls[0][2]).toBe(undefined)
      expect(callback.mock.calls[0][3]).toBe('foo')

      // value NOT changed
      expect(renderInput).toHaveBeenCalledTimes(1)
      expect(renderInput.mock.calls[0][0].input.value).toBe('')
    })

    it('should allow onDragStart callback', () => {
      const store = makeStore()
      const renderInput = jest.fn(props => <input {...props.input} />)
      const callback = jest.fn()
      class Form extends Component {
        render() {
          return (
            <div>
              <Field name="foo" component={renderInput} onDragStart={callback} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      const input = TestUtils.findRenderedDOMComponentWithTag(dom, 'input')

      expect(callback).not.toHaveBeenCalled()

      // rendered once with no onDragStart prop passed down in custom props
      expect(renderInput).toHaveBeenCalledTimes(1)
      expect(renderInput.mock.calls[0][0].onDragStart).toBeFalsy()

      TestUtils.Simulate.dragStart(input, {
        dataTransfer: { setData: () => {} }
      })

      // call back was called
      expect(callback).toHaveBeenCalled()
      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback.mock.calls[0][0]).toBeTruthy() // event
      expect(callback.mock.calls[0][1]).toBe('foo')

      // value NOT changed
      expect(renderInput).toHaveBeenCalledTimes(1)
    })

    it('should strict equals props in immutableProps', () => {
      const store = makeStore()
      const inputRender = jest.fn(props => <input {...props.input} />)
      const formRender = jest.fn()

      class Form extends Component {
        constructor() {
          super()
          this.state = {
            foo: {
              get no() {
                throw new Error('props inside an immutableProps object should not be looked at')
              }
            }
          }
        }

        render() {
          formRender(this.props)
          return (
            <div>
              <Field
                name="input"
                component={inputRender}
                immutableProps={['foo']}
                foo={this.state.foo}
              />
              <button onClick={() => this.setState({ foo: { no: undefined } })}>Change</button>
            </div>
          )
        }
      }
      const TestForm = reduxForm({
        form: 'testForm'
      })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      expect(formRender).toHaveBeenCalled()
      expect(formRender).toHaveBeenCalledTimes(1)

      expect(inputRender).toHaveBeenCalled()
      expect(inputRender).toHaveBeenCalledTimes(1)

      // update foo prop
      const button = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
      TestUtils.Simulate.click(button)

      expect(formRender).toHaveBeenCalledTimes(2)
      expect(inputRender).toHaveBeenCalledTimes(2)
    })
  })
}

describeField('Field.plain', plain, plainCombineReducers, () => expect.extend(plainExpectations))
describeField('Field.immutable', immutable, immutableCombineReducers, () =>
  expect.extend(immutableExpectations)
)
