/* eslint react/no-multi-comp:0 */
import React, { Component } from 'react'
import TestUtils from 'react-dom/test-utils'
import { Provider } from 'react-redux'
import { combineReducers as plainCombineReducers, createStore } from 'redux'
import { combineReducers as immutableCombineReducers } from 'redux-immutable'
import createField from '../createField'
import createFieldArray from '../createFieldArray'
import createFields from '../createFields'
import FormSection from '../FormSection'
import createReducer from '../createReducer'
import createReduxForm from '../createReduxForm'
import immutable from '../structure/immutable'
import immutableExpectations from '../structure/immutable/__tests__/expectations'
import plain from '../structure/plain'
import plainExpectations from '../structure/plain/__tests__/expectations'

const describeFieldArray = (name, structure, combineReducers, setup) => {
  const reduxForm = createReduxForm(structure)
  const FieldArray = createFieldArray(structure)
  const Field = createField(structure)
  const Fields = createFields(structure)
  const reducer = createReducer(structure)
  const { allowsArrayErrors, fromJS, getIn, size } = structure
  const makeStore = initial =>
    createStore(combineReducers({ form: reducer }), fromJS({ form: initial }))

  class TestComponent extends Component {
    render() {
      return <div>TEST INPUT</div>
    }
  }

  const testProps = (state, config = {}) => {
    const store = makeStore({ testForm: state })
    class Form extends Component {
      render() {
        return (
          <div>
            <FieldArray name="foo" component={TestComponent} />
          </div>
        )
      }
    }
    const TestForm = reduxForm({ form: 'testForm', ...config })(Form)
    const dom = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <TestForm />
      </Provider>
    )
    return TestUtils.findRenderedComponentWithType(dom, TestComponent).props
  }

  describe(name, () => {
    beforeAll(() => {
      setup()
    })

    it('should throw an error if not in ReduxForm', () => {
      expect(() => {
        TestUtils.renderIntoDocument(
          <div>
            <FieldArray name="foo" component={TestComponent} />
          </div>
        )
      }).toThrow(/must be inside a component decorated with reduxForm/)
    })

    it('should throw an error if invalid component prop is provided', () => {
      const store = makeStore()
      const notAComponent = {}
      class Form extends Component {
        render() {
          return <FieldArray component={notAComponent} />
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

    it('should get length from Redux state', () => {
      const props = testProps({
        values: {
          foo: ['a', 'b', 'c']
        }
      })
      expect(props.fields.length).toBe(3)
    })

    it('should be okay with no array value', () => {
      const iterate = jest.fn()
      const props = testProps({
        values: {}
      })
      expect(props.fields.length).toBe(0)
      props.fields.forEach(iterate)
      props.fields.map(iterate)
      expect(iterate).not.toHaveBeenCalled()
    })

    it('should get dirty/pristine from Redux state', () => {
      const props1 = testProps({
        initial: {
          foo: ['a', 'b', 'c']
        },
        values: {
          foo: ['a', 'b', 'c']
        }
      })
      expect(props1.meta.pristine).toBe(true)
      expect(props1.meta.dirty).toBe(false)
      const props2 = testProps({
        initial: {
          foo: ['a', 'b', 'c']
        },
        values: {
          foo: ['a', 'b']
        }
      })
      expect(props2.meta.pristine).toBe(false)
      expect(props2.meta.dirty).toBe(true)
    })

    it('should provided meta.form', () => {
      const props = testProps({})
      expect(props.meta.form).toBe('testForm')
    })

    it('should not pass api props into custom', () => {
      const store = makeStore()
      const renderSpy = jest.fn()
      class ArrayComponent extends Component {
        render() {
          renderSpy(this.props)
          return <div />
        }
      }
      const apiProps = {
        // all the official API props you can pass to Field
        component: ArrayComponent,
        name: 'foo',
        props: {},
        validate: () => undefined,
        warn: () => undefined,
        forwardRef: true
      }
      class Form extends Component {
        render() {
          return (
            <div>
              <FieldArray {...apiProps} />
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

    it('should provide name', () => {
      const props = testProps({
        values: {
          foo: []
        }
      })
      expect(props.fields.name).toBe('foo')
    })
    it('should prefix name when inside FormSection', () => {
      const store = makeStore({
        testForm: {
          values: {
            foo: []
          }
        }
      })
      class Form extends Component {
        render() {
          return (
            <div>
              <FormSection name="foo">
                <FieldArray name="bar" component={TestComponent} />
              </FormSection>
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
      const props = TestUtils.findRenderedComponentWithType(dom, TestComponent).props
      expect(props.fields.name).toBe('foo.bar')
    })
    it('should provide forEach', () => {
      const props = testProps({
        values: {
          foo: ['a', 'b', 'c']
        }
      })
      expect(typeof props.fields.forEach).toBe('function')
      const iterate = jest.fn()
      props.fields.forEach(iterate)
      expect(iterate).toHaveBeenCalled()
      expect(iterate).toHaveBeenCalledTimes(3)
      expect(iterate.mock.calls[0]).toEqual(['foo[0]', 0, props.fields])
      expect(iterate.mock.calls[1]).toEqual(['foo[1]', 1, props.fields])
      expect(iterate.mock.calls[2]).toEqual(['foo[2]', 2, props.fields])
    })

    it('should provide map', () => {
      const props = testProps({
        values: {
          foo: ['a', 'b', 'c']
        }
      })
      expect(typeof props.fields.map).toBe('function')
      const iterate = jest.fn()
      props.fields.map(iterate)
      expect(iterate).toHaveBeenCalled()
      expect(iterate).toHaveBeenCalledTimes(3)
      expect(iterate.mock.calls[0]).toEqual(['foo[0]', 0, props.fields])
      expect(iterate.mock.calls[1]).toEqual(['foo[1]', 1, props.fields])
      expect(iterate.mock.calls[2]).toEqual(['foo[2]', 2, props.fields])
    })

    it('should provide insert', () => {
      const props = testProps({
        values: {
          foo: []
        }
      })
      expect(typeof props.fields.insert).toBe('function')
    })

    it('should provide push', () => {
      const props = testProps({
        values: {
          foo: []
        }
      })
      expect(typeof props.fields.push).toBe('function')
    })

    it('should provide pop', () => {
      const props = testProps({
        values: {
          foo: []
        }
      })
      expect(typeof props.fields.pop).toBe('function')
    })

    it('should provide shift', () => {
      const props = testProps({
        values: {
          foo: []
        }
      })
      expect(typeof props.fields.shift).toBe('function')
    })

    it('should provide unshift', () => {
      const props = testProps({
        values: {
          foo: []
        }
      })
      expect(typeof props.fields.unshift).toBe('function')
    })

    it('should provide move', () => {
      const props = testProps({
        values: {
          foo: []
        }
      })
      expect(typeof props.fields.move).toBe('function')
    })

    it('should provide remove', () => {
      const props = testProps({
        values: {
          foo: []
        }
      })
      expect(typeof props.fields.remove).toBe('function')
    })

    it('should provide removeAll', () => {
      const props = testProps({
        values: {
          foo: []
        }
      })
      expect(typeof props.fields.removeAll).toBe('function')
    })

    it('should provide swap', () => {
      const props = testProps({
        values: {
          foo: []
        }
      })
      expect(typeof props.fields.swap).toBe('function')
    })

    it('should provide pass through other props', () => {
      const store = makeStore({
        testForm: {
          values: {
            foo: ['bar']
          }
        }
      })
      const renderArray = jest.fn(() => <div />)
      class Form extends Component {
        render() {
          return (
            <div>
              <FieldArray name="foo" component={renderArray} otherProp="dog" anotherProp="cat" />
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
      expect(renderArray).toHaveBeenCalled()
      expect(renderArray).toHaveBeenCalledTimes(1)
      expect(renderArray.mock.calls[0][0].fields.length).toBe(1)
      expect(renderArray.mock.calls[0][0].otherProp).toBe('dog')
      expect(renderArray.mock.calls[0][0].anotherProp).toBe('cat')
    })

    it('should provide access to rendered component', () => {
      const store = makeStore({
        testForm: {
          values: {
            foo: ['bar']
          }
        }
      })
      class TestComponent extends Component {
        render() {
          return <div>TEST INPUT</div>
        }
      }
      const ref = React.createRef()
      class Form extends Component {
        render() {
          return (
            <div>
              <FieldArray name="foo" component={TestComponent} forwardRef ref={ref} />
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
      const component = TestUtils.findRenderedComponentWithType(dom, TestComponent)

      expect(ref.current.getRenderedComponent()).toBe(component)
    })

    it('should use initialValues', () => {
      const props = testProps(
        {},
        {
          initialValues: {
            foo: ['a', 'b', 'c']
          }
        }
      )
      expect(props.fields.length).toBe(3)
      const iterate = jest.fn()
      props.fields.forEach(iterate)
      expect(iterate).toHaveBeenCalled()
      expect(iterate).toHaveBeenCalledTimes(3)
      expect(iterate.mock.calls[0][0]).toBe('foo[0]')
      expect(iterate.mock.calls[1][0]).toBe('foo[1]')
      expect(iterate.mock.calls[2][0]).toBe('foo[2]')
    })

    it('should get sync errors from outer reduxForm component', () => {
      const props = testProps(
        {
          values: {
            foo: ['bar']
          }
        },
        {
          validate: () => ({ foo: { _error: 'foo error' } })
        }
      )
      expect(props.meta.error).toBe('foo error')
    })

    it('should get sync warnings from outer reduxForm component', () => {
      const props = testProps(
        {
          values: {
            foo: ['bar']
          }
        },
        {
          warn: () => ({ foo: { _warning: 'foo warning' } })
        }
      )
      expect(props.meta.warning).toBe('foo warning')
    })

    it('should get async errors from Redux state', () => {
      const props = testProps({
        values: {
          foo: ['bar']
        },
        asyncErrors: {
          foo: {
            _error: 'foo error'
          }
        }
      })
      expect(props.meta.error).toBe('foo error')
    })

    it('should get submit errors from Redux state', () => {
      const props = testProps({
        values: {
          foo: ['bar']
        },
        submitErrors: {
          foo: {
            _error: 'foo error'
          }
        }
      })
      expect(props.meta.error).toBe('foo error')
    })

    it('should get submitFailed from Redux state', () => {
      const props = testProps({
        values: {
          foo: ['bar']
        },
        submitFailed: true
      })
      expect(props.meta.submitFailed).toBe(true)
    })

    it('should provide name getter', () => {
      const store = makeStore({
        testForm: {
          values: {
            foo: ['bar']
          }
        }
      })
      const ref = React.createRef()
      class Form extends Component {
        render() {
          return (
            <div>
              <FieldArray name="foo" component={TestComponent} ref={ref} />
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
      expect(ref.current.name).toEqual('foo')
    })

    it('should provide value getter', () => {
      const store = makeStore({
        testForm: {
          values: {
            foo: ['bar']
          }
        }
      })
      const ref = React.createRef()
      class Form extends Component {
        render() {
          return (
            <div>
              <FieldArray name="foo" component={TestComponent} ref={ref} />
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
      expect(ref.current.value).toEqualMap(['bar'])
    })

    it('should provide dirty getter that is true when dirty', () => {
      const store = makeStore({
        testForm: {
          initial: {
            foo: ['dog']
          },
          values: {
            foo: ['cat']
          }
        }
      })
      const ref = React.createRef()
      class Form extends Component {
        render() {
          return (
            <div>
              <FieldArray name="foo" component={TestComponent} ref={ref} />
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
            foo: ['dog']
          },
          values: {
            foo: ['dog']
          }
        }
      })
      const ref = React.createRef()
      class Form extends Component {
        render() {
          return (
            <div>
              <FieldArray name="foo" component={TestComponent} ref={ref} />
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

    it('should provide pristine getter that is true when pristine', () => {
      const store = makeStore({
        testForm: {
          initial: {
            foo: ['dog']
          },
          values: {
            foo: ['dog']
          }
        }
      })
      const ref = React.createRef()
      class Form extends Component {
        render() {
          return (
            <div>
              <FieldArray name="foo" component={TestComponent} ref={ref} />
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

    it('should provide pristine getter that is false when dirty', () => {
      const store = makeStore({
        testForm: {
          initial: {
            foo: ['dog']
          },
          values: {
            foo: ['cat']
          }
        }
      })
      const ref = React.createRef()
      class Form extends Component {
        render() {
          return (
            <div>
              <FieldArray name="foo" component={TestComponent} ref={ref} />
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

    it('should provide sync error for array field', () => {
      const store = makeStore({
        testForm: {
          values: {
            foo: [
              {
                library: 'redux-form',
                author: 'erikras'
              }
            ]
          }
        }
      })
      const validate = () => ({
        foo: [
          {
            _error: 'Too awesome!'
          }
        ]
      })
      const renderArray = ({ fields }) => (
        <div>
          {fields.map((name, index) => (
            <div key={index}>
              <Field name={`${name}.library`} component="input" />
              <Field name={`${name}.author`} component="input" />
              <Field name={name} component={props => <strong>{props.meta.error}</strong>} />
            </div>
          ))}
        </div>
      )
      class Form extends Component {
        render() {
          return (
            <div>
              <FieldArray name="foo" component={renderArray} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({
        form: 'testForm',
        validate
      })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )
      const error = TestUtils.findRenderedDOMComponentWithTag(dom, 'strong')
      expect(error.textContent).toBe('Too awesome!')
    })

    it('should provide sync warning for array field', () => {
      const store = makeStore({
        testForm: {
          values: {
            foo: [
              {
                library: 'redux-form',
                author: 'erikras'
              }
            ]
          }
        }
      })
      const warn = () => ({
        foo: [
          {
            _warning: 'Too awesome!'
          }
        ]
      })
      const renderArray = ({ fields }) => (
        <div>
          {fields.map((name, index) => (
            <div key={index}>
              <Field name={`${name}.library`} component="input" />
              <Field name={`${name}.author`} component="input" />
              <Field name={name} component={props => <strong>{props.meta.warning}</strong>} />
            </div>
          ))}
        </div>
      )
      class Form extends Component {
        render() {
          return (
            <div>
              <FieldArray name="foo" component={renderArray} />
            </div>
          )
        }
      }
      const TestForm = reduxForm({
        form: 'testForm',
        warn
      })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )
      const warning = TestUtils.findRenderedDOMComponentWithTag(dom, 'strong')
      expect(warning.textContent).toBe('Too awesome!')
    })

    it('should reconnect when name changes', () => {
      const store = makeStore({
        testForm: {
          values: {
            foo: ['a', 'b'],
            bar: ['c']
          }
        }
      })
      const component = jest.fn(() => <div />)
      class Form extends Component {
        constructor() {
          super()
          this.state = { field: 'foo' }
        }

        render() {
          return (
            <div>
              <FieldArray name={this.state.field} component={component} />
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
      expect(component).toHaveBeenCalled()
      expect(component).toHaveBeenCalledTimes(1)
      expect(component.mock.calls[0][0].fields.length).toBe(2)

      const button = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
      TestUtils.Simulate.click(button)

      expect(component).toHaveBeenCalledTimes(2)
      expect(component.mock.calls[1][0].fields.length).toBe(1)
    })

    it('should not prefix name in fields map callback when inside FormSection', () => {
      const store = makeStore({
        testForm: {
          values: {
            foo: { bar: [{ val: 'dog' }, { val: 'cat' }] }
          }
        }
      })
      const TestArray = ({ fields }) => (
        <div>
          {fields.map(name => (
            <Field key={name} name={`${name}.val`} component={TestComponent} />
          ))}
        </div>
      )
      class Form extends Component {
        render() {
          return (
            <FormSection name="foo">
              <FieldArray name="bar" component={TestArray} />
            </FormSection>
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
            registeredFields: {
              'foo.bar': { name: 'foo.bar', type: 'FieldArray', count: 1 },
              'foo.bar[0].val': {
                name: 'foo.bar[0].val',
                type: 'Field',
                count: 1
              },
              'foo.bar[1].val': {
                name: 'foo.bar[1].val',
                type: 'Field',
                count: 1
              }
            },
            values: {
              foo: { bar: [{ val: 'dog' }, { val: 'cat' }] }
            }
          }
        }
      })

      const components = TestUtils.scryRenderedComponentsWithType(dom, TestComponent)
      expect(components[0].props.input.name).toBe('foo.bar[0].val')
      expect(components[1].props.input.name).toBe('foo.bar[1].val')
    })

    it('should prefix name getter when inside FormSection', () => {
      const store = makeStore({
        testForm: {
          values: {
            foo: { bar: [{ val: 'dog' }, { val: 'cat' }] }
          }
        }
      })
      const TestArray = ({ fields }) => (
        <div>
          {fields.map(name => (
            <Field key={name} name={`${name}.val`} component={TestComponent} />
          ))}
        </div>
      )
      const ref = React.createRef()
      class Form extends Component {
        render() {
          return (
            <FormSection name="foo">
              <FieldArray name="bar" component={TestArray} ref={ref} />
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

    it('should not prefix name in fields map callback when inside multiple FormSection', () => {
      const store = makeStore({
        testForm: {
          values: {
            foo: { fighter: { bar: [{ val: 'dog' }, { val: 'cat' }] } }
          }
        }
      })
      const TestArray = ({ fields }) => (
        <div>
          {fields.map(name => (
            <Field key={name} name={`${name}.val`} component={TestComponent} />
          ))}
        </div>
      )
      class Form extends Component {
        render() {
          return (
            <FormSection name="foo">
              <FormSection name="fighter">
                <FieldArray name="bar" component={TestArray} />
              </FormSection>
            </FormSection>
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
            registeredFields: {
              'foo.fighter.bar': {
                name: 'foo.fighter.bar',
                type: 'FieldArray',
                count: 1
              },
              'foo.fighter.bar[0].val': {
                name: 'foo.fighter.bar[0].val',
                type: 'Field',
                count: 1
              },
              'foo.fighter.bar[1].val': {
                name: 'foo.fighter.bar[1].val',
                type: 'Field',
                count: 1
              }
            },
            values: {
              foo: { fighter: { bar: [{ val: 'dog' }, { val: 'cat' }] } }
            }
          }
        }
      })

      const components = TestUtils.scryRenderedComponentsWithType(dom, TestComponent)
      expect(components[0].props.input.name).toBe('foo.fighter.bar[0].val')
      expect(components[1].props.input.name).toBe('foo.fighter.bar[1].val')
    })
    it('should prefix name getter when inside multiple FormSection', () => {
      const store = makeStore({
        testForm: {
          values: {
            foo: { fighter: { bar: [{ val: 'dog' }, { val: 'cat' }] } }
          }
        }
      })
      const TestArray = ({ fields }) => (
        <div>
          {fields.map(name => (
            <Field key={name} name={`${name}.val`} component={TestComponent} />
          ))}
        </div>
      )
      const ref = React.createRef()
      class Form extends Component {
        render() {
          return (
            <FormSection name="foo">
              <FormSection name="fighter">
                <FieldArray name="bar" component={TestArray} ref={ref} />
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

    it('should provide field-level sync error for array field', () => {
      const store = makeStore({
        testForm: {
          values: {
            foo: ['dog', 'cat']
          }
        }
      })
      const renderArray = jest.fn(({ fields }) => (
        <div>
          {fields.map((name, index) => (
            <Field name={`${name}`} component="input" key={index} />
          ))}
        </div>
      ))
      const noMoreThanTwo = jest.fn(value => (value && size(value) > 2 ? 'Too many' : undefined))

      class Form extends Component {
        render() {
          return (
            <div>
              <FieldArray name="foo" component={renderArray} validate={noMoreThanTwo} />
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

      expect(renderArray).toHaveBeenCalled()
      expect(renderArray).toHaveBeenCalledTimes(1)
      expect(renderArray.mock.calls[0][0].meta.valid).toBe(true)
      expect(renderArray.mock.calls[0][0].meta.error).toBeFalsy()

      expect(noMoreThanTwo).toHaveBeenCalled()
      expect(noMoreThanTwo).toHaveBeenCalledTimes(1)
      expect(noMoreThanTwo.mock.calls[0][0]).toEqualMap(['dog', 'cat'])

      renderArray.mock.calls[0][0].fields.push('rat')

      // should validate
      expect(noMoreThanTwo).toHaveBeenCalledTimes(2)
      expect(noMoreThanTwo.mock.calls[1][0]).toEqualMap(['dog', 'cat', 'rat'])

      // should rerender
      expect(renderArray).toHaveBeenCalledTimes(3)
      expect(renderArray.mock.calls[2][0].meta.valid).toBe(false)
      expect(renderArray.mock.calls[2][0].meta.error).toBe('Too many')
    })

    it('should provide field-level sync error for field added to a FieldArray that has been emptied', () => {
      const store = makeStore({
        testForm: {
          values: {
            foo: ['dog']
          }
        }
      })
      const required = jest.fn(value => (value == null ? 'Required' : undefined))
      const renderArray = jest.fn(({ fields }) => (
        <div>
          {fields.map((name, index) => (
            <Field name={`${name}`} component="input" key={index} validate={required} />
          ))}
        </div>
      ))

      class Form extends Component {
        render() {
          return (
            <div>
              <FieldArray name="foo" component={renderArray} />
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

      expect(renderArray).toHaveBeenCalled()
      expect(renderArray).toHaveBeenCalledTimes(1)
      expect(renderArray.mock.calls[0][0].meta.valid).toBe(true)
      expect(renderArray.mock.calls[0][0].meta.error).toBeFalsy()

      expect(required).toHaveBeenCalled()
      expect(required).toHaveBeenCalledTimes(1)
      expect(required.mock.calls[0][0]).toEqual('dog')

      renderArray.mock.calls[0][0].fields.pop()

      required.mockClear()

      renderArray.mock.calls[0][0].fields.push('rat')

      // should validate
      expect(required).toHaveBeenCalled()
      expect(required).toHaveBeenCalledTimes(1)
      expect(required.mock.calls[0][0]).toEqual('rat')
    })

    it('should provide field-level sync error (with multiple validators) for array field', () => {
      const store = makeStore({
        testForm: {
          values: {
            foo: ['dog', 'cat']
          }
        }
      })
      const renderArray = jest.fn(({ fields }) => (
        <div>
          {fields.map((name, index) => (
            <Field name={`${name}`} component="input" key={index} />
          ))}
        </div>
      ))
      const atLeastOne = jest.fn(value => (value && size(value) < 1 ? 'Too few' : undefined))
      const noMoreThanTwo = jest.fn(value => (value && size(value) > 2 ? 'Too many' : undefined))

      class Form extends Component {
        render() {
          return (
            <div>
              <FieldArray
                name="foo"
                component={renderArray}
                validate={[atLeastOne, noMoreThanTwo]}
              />
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

      expect(renderArray).toHaveBeenCalled()
      expect(renderArray).toHaveBeenCalledTimes(1)
      expect(renderArray.mock.calls[0][0].meta.valid).toBe(true)
      expect(renderArray.mock.calls[0][0].meta.error).toBeFalsy()

      expect(noMoreThanTwo).toHaveBeenCalled()
      expect(noMoreThanTwo).toHaveBeenCalledTimes(1)
      expect(noMoreThanTwo.mock.calls[0][0]).toEqualMap(['dog', 'cat'])

      renderArray.mock.calls[0][0].fields.push('rat')

      // should validate
      expect(noMoreThanTwo).toHaveBeenCalledTimes(2)
      expect(noMoreThanTwo.mock.calls[1][0]).toEqualMap(['dog', 'cat', 'rat'])

      // should rerender
      expect(renderArray).toHaveBeenCalledTimes(3)
      expect(renderArray.mock.calls[2][0].meta.valid).toBe(false)
      expect(renderArray.mock.calls[2][0].meta.error).toBe('Too many')
    })

    it('should provide field-level sync warning for array field', () => {
      const store = makeStore({
        testForm: {
          values: {
            foo: ['dog', 'cat']
          }
        }
      })
      const renderArray = jest.fn(({ fields }) => (
        <div>
          {fields.map((name, index) => (
            <Field name={`${name}`} component="input" key={index} />
          ))}
        </div>
      ))
      const noMoreThanTwo = jest.fn(value => (value && size(value) > 2 ? 'Too many' : undefined))

      class Form extends Component {
        render() {
          return (
            <div>
              <FieldArray name="foo" component={renderArray} warn={noMoreThanTwo} />
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

      expect(renderArray).toHaveBeenCalled()
      expect(renderArray).toHaveBeenCalledTimes(1)
      expect(renderArray.mock.calls[0][0].meta.valid).toBe(true)
      expect(renderArray.mock.calls[0][0].meta.warning).toBeFalsy()

      expect(noMoreThanTwo).toHaveBeenCalled()
      expect(noMoreThanTwo).toHaveBeenCalledTimes(1)
      expect(noMoreThanTwo.mock.calls[0][0]).toEqualMap(['dog', 'cat'])

      renderArray.mock.calls[0][0].fields.push('rat')

      // should validate
      expect(noMoreThanTwo).toHaveBeenCalledTimes(2)
      expect(noMoreThanTwo.mock.calls[1][0]).toEqualMap(['dog', 'cat', 'rat'])

      // should rerender
      expect(renderArray).toHaveBeenCalledTimes(3)
      expect(renderArray.mock.calls[2][0].meta.valid).toBe(true) // just a warning
      expect(renderArray.mock.calls[2][0].meta.warning).toBe('Too many')
    })

    it('should provide field-level sync warning (with multiple validators) for array field', () => {
      const store = makeStore({
        testForm: {
          values: {
            foo: ['dog', 'cat']
          }
        }
      })
      const renderArray = jest.fn(({ fields }) => (
        <div>
          {fields.map((name, index) => (
            <Field name={`${name}`} component="input" key={index} />
          ))}
        </div>
      ))
      const atLeastOne = jest.fn(value => (value && size(value) < 1 ? 'Too few' : undefined))
      const noMoreThanTwo = jest.fn(value => (value && size(value) > 2 ? 'Too many' : undefined))

      class Form extends Component {
        render() {
          return (
            <div>
              <FieldArray name="foo" component={renderArray} warn={[atLeastOne, noMoreThanTwo]} />
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

      expect(renderArray).toHaveBeenCalled()
      expect(renderArray).toHaveBeenCalledTimes(1)
      expect(renderArray.mock.calls[0][0].meta.valid).toBe(true)
      expect(renderArray.mock.calls[0][0].meta.warning).toBeFalsy()

      expect(noMoreThanTwo).toHaveBeenCalled()
      expect(noMoreThanTwo).toHaveBeenCalledTimes(1)
      expect(noMoreThanTwo.mock.calls[0][0]).toEqualMap(['dog', 'cat'])

      renderArray.mock.calls[0][0].fields.push('rat')

      // should validate
      expect(noMoreThanTwo).toHaveBeenCalledTimes(2)
      expect(noMoreThanTwo.mock.calls[1][0]).toEqualMap(['dog', 'cat', 'rat'])

      // should rerender
      expect(renderArray).toHaveBeenCalledTimes(3)
      expect(renderArray.mock.calls[2][0].meta.valid).toBe(true) // just a warning
      expect(renderArray.mock.calls[2][0].meta.warning).toBe('Too many')
    })

    it('should reconnect when props change', () => {
      const store = makeStore()
      const component = jest.fn(() => <div />)
      class Form extends Component {
        constructor() {
          super()
          this.state = { foo: 'foo', bar: 'bar' }
        }

        render() {
          return (
            <div>
              <FieldArray
                name="foo"
                foo={this.state.foo}
                bar={this.state.bar}
                component={component}
              />
              <button onClick={() => this.setState({ foo: 'qux', bar: 'baz' })}>Change</button>
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
      expect(component).toHaveBeenCalled()
      expect(component).toHaveBeenCalledTimes(1)
      expect(component.mock.calls[0][0].foo).toBe('foo')
      expect(component.mock.calls[0][0].bar).toBe('bar')

      const button = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
      TestUtils.Simulate.click(button)

      expect(component).toHaveBeenCalledTimes(2)
      expect(component.mock.calls[1][0].foo).toBe('qux')
      expect(component.mock.calls[1][0].bar).toBe('baz')
    })

    it('should allow addition after focus', () => {
      const store = makeStore()
      const component = jest.fn(() => <div />)
      class Form extends Component {
        constructor() {
          super()
          this.state = { foo: 'foo', bar: 'bar' }
        }

        render() {
          return (
            <div>
              <FieldArray
                name="foo"
                foo={this.state.foo}
                bar={this.state.bar}
                component={component}
              />
              <button onClick={() => this.setState({ foo: 'qux', bar: 'baz' })}>Change</button>
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
      expect(component).toHaveBeenCalled()
      expect(component).toHaveBeenCalledTimes(1)
      expect(component.mock.calls[0][0].foo).toBe('foo')
      expect(component.mock.calls[0][0].bar).toBe('bar')

      const button = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
      TestUtils.Simulate.click(button)

      expect(component).toHaveBeenCalledTimes(2)
      expect(component.mock.calls[1][0].foo).toBe('qux')
      expect(component.mock.calls[1][0].bar).toBe('baz')
    })

    it('should rerender when items added or removed', () => {
      const store = makeStore({})
      const renderField = jest.fn(props => <input {...props.input} />)
      const renderFieldArray = jest.fn(({ fields }) => (
        <div>
          {fields.map(field => (
            <Field name={field} component={renderField} key={field} />
          ))}
          <button className="add" onClick={() => fields.push()}>
            Add Dog
          </button>
          <button className="remove" onClick={() => fields.pop()}>
            Remove Dog
          </button>
        </div>
      ))
      class Form extends Component {
        render() {
          return <FieldArray name="dogs" component={renderFieldArray} />
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )
      const addButton = TestUtils.findRenderedDOMComponentWithClass(dom, 'add')
      const removeButton = TestUtils.findRenderedDOMComponentWithClass(dom, 'remove')

      // length is 0
      expect(renderFieldArray).toHaveBeenCalled()
      expect(renderFieldArray).toHaveBeenCalledTimes(1)
      expect(renderFieldArray.mock.calls[0][0].fields.length).toBe(0)

      // add field
      TestUtils.Simulate.click(addButton)

      // field array rerendered, length is 1
      expect(renderFieldArray).toHaveBeenCalledTimes(2)
      expect(renderFieldArray.mock.calls[1][0].fields.length).toBe(1)

      // add field
      TestUtils.Simulate.click(addButton)

      // field array rerendered, length is 2
      expect(renderFieldArray).toHaveBeenCalledTimes(3)
      expect(renderFieldArray.mock.calls[2][0].fields.length).toBe(2)

      // add field
      TestUtils.Simulate.click(addButton)

      // field array rerendered, length is 3
      expect(renderFieldArray).toHaveBeenCalledTimes(4)
      expect(renderFieldArray.mock.calls[3][0].fields.length).toBe(3)

      // remove field
      TestUtils.Simulate.click(removeButton)

      // field array rerendered, length is 2
      expect(renderFieldArray).toHaveBeenCalledTimes(5)
      expect(renderFieldArray.mock.calls[4][0].fields.length).toBe(2)

      // add field
      TestUtils.Simulate.click(addButton)

      // field array rerendered, length is 3
      expect(renderFieldArray).toHaveBeenCalledTimes(6)
      expect(renderFieldArray.mock.calls[5][0].fields.length).toBe(3)
    })

    it('should rerender when items swapped', () => {
      const store = makeStore({
        testForm: {
          values: {
            items: ['dog', 'cat']
          }
        }
      })
      const renderField = jest.fn(props => <input {...props.input} />)
      const renderFieldArray = jest.fn(({ fields }) => (
        <div>
          {fields.map(field => (
            <Field name={field} component={renderField} key={field} />
          ))}
          <button className="swap" onClick={() => fields.swap(0, 1)}>
            Swap items
          </button>
        </div>
      ))
      class Form extends Component {
        render() {
          return <FieldArray name="items" component={renderFieldArray} />
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )
      const swapButton = TestUtils.findRenderedDOMComponentWithClass(dom, 'swap')

      // length is 0
      expect(renderFieldArray).toHaveBeenCalled()
      expect(renderFieldArray).toHaveBeenCalledTimes(1)
      expect(renderFieldArray.mock.calls[0][0].fields.length).toBe(2)
      expect(renderField.mock.calls[0][0].input.value).toBe('dog')
      expect(renderField.mock.calls[1][0].input.value).toBe('cat')

      expect(renderFieldArray.mock.calls[0][0].fields.get(0)).toBe('dog')
      expect(renderFieldArray.mock.calls[0][0].fields.get(1)).toBe('cat')

      // add field
      TestUtils.Simulate.click(swapButton)

      // field array rerendered, items swapped
      expect(renderFieldArray).toHaveBeenCalledTimes(2)
      expect(renderFieldArray.mock.calls[1][0].fields.length).toBe(2)
      expect(renderField.mock.calls[2][0].input.value).toBe('cat')
      expect(renderField.mock.calls[3][0].input.value).toBe('dog')

      expect(renderFieldArray.mock.calls[1][0].fields.get(0)).toBe('cat')
      expect(renderFieldArray.mock.calls[1][0].fields.get(1)).toBe('dog')
    })

    it('should rerender when array sync error appears or disappears', () => {
      if (allowsArrayErrors) {
        const store = makeStore({
          testForm: {
            values: {
              dogs: []
            }
          }
        })
        const renderFieldArray = jest.fn(({ fields }) => (
          <div>
            {fields.map((field, index) => (
              <div key={index}>{field}</div>
            ))}
            <button className="add" onClick={() => fields.push()}>
              Add Dog
            </button>
            <button className="remove" onClick={() => fields.pop()}>
              Remove Dog
            </button>
          </div>
        ))
        class Form extends Component {
          render() {
            return <FieldArray name="dogs" component={renderFieldArray} />
          }
        }
        const TestForm = reduxForm({
          form: 'testForm',
          validate: values => {
            const dogs = getIn(values, 'dogs')
            const errors = {
              dogs: []
            }
            if (dogs && size(dogs) === 0) {
              errors.dogs._error = 'No dogs'
            }
            if (dogs && size(dogs) > 1) {
              errors.dogs._error = 'Too many'
            }
            return errors
          }
        })(Form)
        const dom = TestUtils.renderIntoDocument(
          <Provider store={store}>
            <TestForm />
          </Provider>
        )
        const addButton = TestUtils.findRenderedDOMComponentWithClass(dom, 'add')
        const removeButton = TestUtils.findRenderedDOMComponentWithClass(dom, 'remove')

        // length is 0, ERROR!
        expect(renderFieldArray).toHaveBeenCalled()
        expect(renderFieldArray).toHaveBeenCalledTimes(2)
        expect(renderFieldArray.mock.calls[1][0].fields.length).toBe(0)
        expect(renderFieldArray.mock.calls[1][0].meta.error).toBeTruthy()
        expect(renderFieldArray.mock.calls[1][0].meta.error).toBe('No dogs')

        renderFieldArray.mockClear()
        TestUtils.Simulate.click(addButton) // length goes to 1, no error yet

        expect(renderFieldArray).toHaveBeenCalledTimes(1)
        expect(renderFieldArray.mock.calls[0][0].fields.length).toBe(1)
        expect(renderFieldArray.mock.calls[0][0].meta.error).toBeFalsy()

        renderFieldArray.mockClear()
        TestUtils.Simulate.click(addButton) // length goes to 2, ERROR!

        expect(renderFieldArray).toHaveBeenCalledTimes(2)
        expect(renderFieldArray.mock.calls[1][0].fields.length).toBe(2)
        expect(renderFieldArray.mock.calls[1][0].meta.error).toBeTruthy()
        expect(renderFieldArray.mock.calls[1][0].meta.error).toBe('Too many')

        renderFieldArray.mockClear()
        TestUtils.Simulate.click(removeButton) // length goes to 1, ERROR disappears!

        expect(renderFieldArray).toHaveBeenCalledTimes(2)
        expect(renderFieldArray.mock.calls[1][0].fields.length).toBe(1)
        expect(renderFieldArray.mock.calls[1][0].meta.error).toBeFalsy()

        renderFieldArray.mockClear()
        TestUtils.Simulate.click(removeButton) // length goes to 0, ERROR!

        expect(renderFieldArray).toHaveBeenCalledTimes(2)
        expect(renderFieldArray.mock.calls[1][0].fields.length).toBe(0)
        expect(renderFieldArray.mock.calls[1][0].meta.error).toBeTruthy()
        expect(renderFieldArray.mock.calls[1][0].meta.error).toBe('No dogs')
      }
    })

    it('should rerender when array sync warning appears or disappears', () => {
      const store = makeStore({
        testForm: {
          values: {
            dogs: []
          }
        }
      })
      const renderFieldArray = jest.fn(({ fields }) => (
        <div>
          {fields.map((field, index) => (
            <div key={index}>{field}</div>
          ))}
          <button className="add" onClick={() => fields.push()}>
            Add Dog
          </button>
          <button className="remove" onClick={() => fields.pop()}>
            Remove Dog
          </button>
        </div>
      ))
      class Form extends Component {
        render() {
          return <FieldArray name="dogs" component={renderFieldArray} />
        }
      }
      const TestForm = reduxForm({
        form: 'testForm',
        warn: values => {
          const dogs = getIn(values, 'dogs')
          const warnings = {
            dogs: []
          }
          if (dogs && size(dogs) === 0) {
            warnings.dogs._warning = 'No dogs'
          }
          if (dogs && size(dogs) > 1) {
            warnings.dogs._warning = 'Too many'
          }
          return warnings
        }
      })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )
      const addButton = TestUtils.findRenderedDOMComponentWithClass(dom, 'add')
      const removeButton = TestUtils.findRenderedDOMComponentWithClass(dom, 'remove')

      // length is 0, ERROR!
      expect(renderFieldArray).toHaveBeenCalled()
      expect(renderFieldArray).toHaveBeenCalledTimes(2)
      expect(renderFieldArray.mock.calls[1][0].fields.length).toBe(0)
      expect(renderFieldArray.mock.calls[1][0].meta.warning).toBeTruthy()
      expect(renderFieldArray.mock.calls[1][0].meta.warning).toBe('No dogs')

      TestUtils.Simulate.click(addButton) // length goes to 1, no warning yet

      expect(renderFieldArray).toHaveBeenCalledTimes(3)
      expect(renderFieldArray.mock.calls[2][0].fields.length).toBe(1)
      expect(renderFieldArray.mock.calls[2][0].meta.warning).toBeFalsy()

      TestUtils.Simulate.click(addButton) // length goes to 2, ERROR!

      expect(renderFieldArray).toHaveBeenCalledTimes(5)
      expect(renderFieldArray.mock.calls[4][0].fields.length).toBe(2)
      expect(renderFieldArray.mock.calls[4][0].meta.warning).toBeTruthy()
      expect(renderFieldArray.mock.calls[4][0].meta.warning).toBe('Too many')

      TestUtils.Simulate.click(removeButton) // length goes to 1, ERROR disappears!

      expect(renderFieldArray).toHaveBeenCalledTimes(7)
      expect(renderFieldArray.mock.calls[6][0].fields.length).toBe(1)
      expect(renderFieldArray.mock.calls[6][0].meta.warning).toBeFalsy()

      TestUtils.Simulate.click(removeButton) // length goes to 0, ERROR!

      expect(renderFieldArray).toHaveBeenCalledTimes(9)
      expect(renderFieldArray.mock.calls[8][0].fields.length).toBe(0)
      expect(renderFieldArray.mock.calls[8][0].meta.warning).toBeTruthy()
      expect(renderFieldArray.mock.calls[8][0].meta.warning).toBe('No dogs')
    })

    it('should rerender when depending value has updated', () => {
      const store = makeStore({
        testForm: {
          values: {
            dogs: [
              {
                name: 'Fido',
                hasCollar: false
              },
              {
                name: 'Snoopy',
                hasCollar: false
              }
            ]
          }
        }
      })
      const renderFieldArray = jest.fn(({ fields }) => (
        <div>
          {fields.map((field, index) => (
            <div key={index}>
              {getIn(fields.get(index), 'hasCollar') && <span className="collar" />}
              <Field name={`${field}.hasCollar`} component="input" type="checkbox" />
              <Field name={`${field}.name`} component="input" />
            </div>
          ))}
          <button className="add" onClick={() => fields.push()}>
            Add Dog
          </button>
          <button className="remove" onClick={() => fields.pop()}>
            Remove Dog
          </button>
        </div>
      ))
      class Form extends Component {
        render() {
          return <FieldArray name="dogs" component={renderFieldArray} />
        }
      }
      const TestForm = reduxForm({
        pure: false,
        form: 'testForm'
      })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      const checkbox = TestUtils.scryRenderedDOMComponentsWithTag(dom, 'input').find(
        element => element.getAttribute('name') === 'dogs[0].hasCollar'
      )

      TestUtils.Simulate.change(checkbox, { target: { value: true } })

      expect(TestUtils.scryRenderedDOMComponentsWithClass(dom, 'collar').length).toBe(1)

      TestUtils.Simulate.change(checkbox, { target: { value: false } })

      expect(TestUtils.scryRenderedDOMComponentsWithClass(dom, 'collar').length).toBe(0)
    })

    it('should NOT rerender when a value changes', () => {
      const store = makeStore({
        testForm: {
          values: {
            dogs: ['Fido', 'Snoopy']
          }
        }
      })
      const renderField = jest.fn(props => <input {...props.input} />)
      const renderFieldArray = jest.fn(({ fields }) => (
        <div>
          {fields.map(field => (
            <Field name={field} component={renderField} key={field} />
          ))}
        </div>
      ))
      class Form extends Component {
        render() {
          return <FieldArray name="dogs" component={renderFieldArray} />
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      // field array rendered
      expect(renderFieldArray).toHaveBeenCalled()
      expect(renderFieldArray).toHaveBeenCalledTimes(1)

      // both fields rendered
      expect(renderField).toHaveBeenCalled()
      expect(renderField).toHaveBeenCalledTimes(2)
      expect(renderField.mock.calls[0][0].input.value).toBe('Fido')

      // change first field
      renderField.mock.calls[0][0].input.onChange('Odie')

      // first field rerendered, second field is NOT
      expect(renderField).toHaveBeenCalledTimes(3)
      expect(renderField.mock.calls[2][0].input.name).toBe('dogs[0]')
      expect(renderField.mock.calls[2][0].input.value).toBe('Odie')

      // field array NOT rerendered
      expect(renderFieldArray).toHaveBeenCalledTimes(1)
    })

    it('should rerender when a value changes if rerenderOnEveryChange is set', () => {
      const store = makeStore({
        testForm: {
          values: {
            dogs: ['Fido', 'Snoopy']
          }
        }
      })
      const renderField = jest.fn(props => <input {...props.input} />)
      const renderFieldArray = jest.fn(({ fields }) => (
        <div>
          {fields.map(field => (
            <Field name={field} component={renderField} key={field} />
          ))}
        </div>
      ))
      class Form extends Component {
        render() {
          return <FieldArray name="dogs" component={renderFieldArray} rerenderOnEveryChange />
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      // field array rendered
      expect(renderFieldArray).toHaveBeenCalled()
      expect(renderFieldArray).toHaveBeenCalledTimes(1)

      // both fields rendered
      expect(renderField).toHaveBeenCalled()
      expect(renderField).toHaveBeenCalledTimes(2)
      expect(renderField.mock.calls[0][0].input.value).toBe('Fido')

      // change first field
      renderField.mock.calls[0][0].input.onChange('Odie')

      // first field rerendered, second field is NOT
      expect(renderField).toHaveBeenCalledTimes(3)
      expect(renderField.mock.calls[2][0].input.name).toBe('dogs[0]')
      expect(renderField.mock.calls[2][0].input.value).toBe('Odie')

      // field array rerendered
      expect(renderFieldArray).toHaveBeenCalledTimes(2)
    })

    it('should rerender when a value changes if rerenderOnEveryChange is set and FieldArray has multiple groups with same values', () => {
      const store = makeStore({
        testForm: {
          values: {
            dogs: [
              {
                name: 'Fido',
                owner: 'Alex'
              },
              {
                name: 'Odie',
                owner: 'Alex'
              },
              {
                name: 'Fido',
                owner: 'Alex'
              },
              {
                name: 'Snoopy',
                owner: 'Alex'
              }
            ]
          }
        }
      })
      const renderField = jest.fn(props => <input {...props.input} />)
      const renderFieldArray = jest.fn(({ fields }) => (
        <div>
          {fields.map(member => (
            <div key={member}>
              <Field name={`${member}.name`} component={renderField} />
              <Field name={`${member}.owner`} component={renderField} />
            </div>
          ))}
        </div>
      ))
      class Form extends Component {
        render() {
          return <FieldArray name="dogs" component={renderFieldArray} rerenderOnEveryChange />
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      // field array rendered
      expect(renderFieldArray).toHaveBeenCalled()
      expect(renderFieldArray).toHaveBeenCalledTimes(1)

      // both fields rendered
      expect(renderField).toHaveBeenCalled()
      expect(renderField).toHaveBeenCalledTimes(8)
      expect(renderField.mock.calls[0][0].input.value).toBe('Fido')

      // change first name field
      renderField.mock.calls[0][0].input.onChange('Odie')

      // first name field rerendered, other fields is NOT
      expect(renderField).toHaveBeenCalledTimes(9)
      expect(renderField.mock.calls[8][0].input.name).toBe('dogs[0].name')
      expect(renderField.mock.calls[8][0].input.value).toBe('Odie')

      // field array rerendered
      expect(renderFieldArray).toHaveBeenCalledTimes(2)
    })

    it('should create a list in the store on push(undefined)', () => {
      const store = makeStore({})
      const renderField = jest.fn(props => <input {...props.input} />)
      const renderFieldArray = jest.fn(({ fields }) => (
        <div>
          {fields.map(field => (
            <Field name={field} component={renderField} key={field} />
          ))}
          <button onClick={() => fields.push()}>Add Dog</button>
        </div>
      ))
      class Form extends Component {
        render() {
          return <FieldArray name="dogs" component={renderFieldArray} />
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )
      const button = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')

      // only registered field array in store
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: {
              dogs: { name: 'dogs', type: 'FieldArray', count: 1 }
            }
          }
        }
      })

      // length is 0
      expect(renderFieldArray).toHaveBeenCalled()
      expect(renderFieldArray).toHaveBeenCalledTimes(1)
      expect(renderFieldArray.mock.calls[0][0].fields.length).toBe(0)

      // add field
      TestUtils.Simulate.click(button)

      // field array rerendered
      expect(renderFieldArray).toHaveBeenCalledTimes(2)
      expect(renderFieldArray.mock.calls[1][0].fields.length).toBe(1)

      // field rendered
      expect(renderField).toHaveBeenCalled()
      expect(renderField).toHaveBeenCalledTimes(1)
      expect(renderField.mock.calls[0][0].input.name).toBe('dogs[0]')
      expect(renderField.mock.calls[0][0].input.value).toBe('')

      // field registered in store
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            values: {
              dogs: [undefined]
            },
            registeredFields: {
              dogs: { name: 'dogs', type: 'FieldArray', count: 1 },
              'dogs[0]': { name: 'dogs[0]', type: 'Field', count: 1 }
            }
          }
        }
      })

      // values list is a list
      expect(getIn(store.getState(), 'form.testForm.values.dogs')).toBeAList()
    })

    it('should create a list in the store on push(value)', () => {
      const store = makeStore({})
      const renderField = jest.fn(props => <input {...props.input} />)
      const renderFieldArray = jest.fn(({ fields }) => (
        <div>
          {fields.map(field => (
            <Field name={field} component={renderField} key={field} />
          ))}
          <button onClick={() => fields.push('Fido')}>Add Dog</button>
        </div>
      ))
      class Form extends Component {
        render() {
          return <FieldArray name="dogs" component={renderFieldArray} />
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )
      const button = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')

      // only registered field array in store
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: {
              dogs: { name: 'dogs', type: 'FieldArray', count: 1 }
            }
          }
        }
      })

      // length is 0
      expect(renderFieldArray).toHaveBeenCalled()
      expect(renderFieldArray).toHaveBeenCalledTimes(1)
      expect(renderFieldArray.mock.calls[0][0].fields.length).toBe(0)

      // add field
      TestUtils.Simulate.click(button)

      // field array rerendered
      expect(renderFieldArray).toHaveBeenCalledTimes(2)
      expect(renderFieldArray.mock.calls[1][0].fields.length).toBe(1)

      // field rendered
      expect(renderField).toHaveBeenCalled()
      expect(renderField).toHaveBeenCalledTimes(1)
      expect(renderField.mock.calls[0][0].input.name).toBe('dogs[0]')
      expect(renderField.mock.calls[0][0].input.value).toBe('Fido')

      // field registered in store
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            values: {
              dogs: ['Fido']
            },
            registeredFields: {
              dogs: { name: 'dogs', type: 'FieldArray', count: 1 },
              'dogs[0]': { name: 'dogs[0]', type: 'Field', count: 1 }
            }
          }
        }
      })

      // values list is a list
      expect(getIn(store.getState(), 'form.testForm.values.dogs')).toBeAList()
    })

    it('should create a list in the store on unshift(undefined)', () => {
      const store = makeStore({})
      const renderField = jest.fn(props => <input {...props.input} />)
      const renderFieldArray = jest.fn(({ fields }) => (
        <div>
          {fields.map(field => (
            <Field name={field} component={renderField} key={field} />
          ))}
          <button onClick={() => fields.unshift()}>Add Dog</button>
        </div>
      ))
      class Form extends Component {
        render() {
          return <FieldArray name="dogs" component={renderFieldArray} />
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )
      const button = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')

      // only registered field array in store
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: {
              dogs: { name: 'dogs', type: 'FieldArray', count: 1 }
            }
          }
        }
      })

      // length is 0
      expect(renderFieldArray).toHaveBeenCalled()
      expect(renderFieldArray).toHaveBeenCalledTimes(1)
      expect(renderFieldArray.mock.calls[0][0].fields.length).toBe(0)

      // add field
      TestUtils.Simulate.click(button)

      // field array rerendered
      expect(renderFieldArray).toHaveBeenCalledTimes(2)
      expect(renderFieldArray.mock.calls[1][0].fields.length).toBe(1)

      // field rendered
      expect(renderField).toHaveBeenCalled()
      expect(renderField).toHaveBeenCalledTimes(1)
      expect(renderField.mock.calls[0][0].input.name).toBe('dogs[0]')
      expect(renderField.mock.calls[0][0].input.value).toBe('')

      // field registered in store
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            values: {
              dogs: [undefined]
            },
            registeredFields: {
              dogs: { name: 'dogs', type: 'FieldArray', count: 1 },
              'dogs[0]': { name: 'dogs[0]', type: 'Field', count: 1 }
            }
          }
        }
      })

      // values list is a list
      expect(getIn(store.getState(), 'form.testForm.values.dogs')).toBeAList()
    })

    it('should create a list in the store on unshift(value)', () => {
      const store = makeStore({})
      const renderField = jest.fn(props => <input {...props.input} />)
      const renderFieldArray = jest.fn(({ fields }) => (
        <div>
          {fields.map(field => (
            <Field name={field} component={renderField} key={field} />
          ))}
          <button onClick={() => fields.unshift('Fido')}>Add Dog</button>
        </div>
      ))
      class Form extends Component {
        render() {
          return <FieldArray name="dogs" component={renderFieldArray} />
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )
      const button = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')

      // only registered field array in store
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: {
              dogs: { name: 'dogs', type: 'FieldArray', count: 1 }
            }
          }
        }
      })

      // length is 0
      expect(renderFieldArray).toHaveBeenCalled()
      expect(renderFieldArray).toHaveBeenCalledTimes(1)
      expect(renderFieldArray.mock.calls[0][0].fields.length).toBe(0)

      // add field
      TestUtils.Simulate.click(button)

      // field array rerendered
      expect(renderFieldArray).toHaveBeenCalledTimes(2)
      expect(renderFieldArray.mock.calls[1][0].fields.length).toBe(1)

      // field rendered
      expect(renderField).toHaveBeenCalled()
      expect(renderField).toHaveBeenCalledTimes(1)
      expect(renderField.mock.calls[0][0].input.name).toBe('dogs[0]')
      expect(renderField.mock.calls[0][0].input.value).toBe('Fido')

      // field registered in store
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            values: {
              dogs: ['Fido']
            },
            registeredFields: {
              dogs: { name: 'dogs', type: 'FieldArray', count: 1 },
              'dogs[0]': { name: 'dogs[0]', type: 'Field', count: 1 }
            }
          }
        }
      })

      // values list is a list
      expect(getIn(store.getState(), 'form.testForm.values.dogs')).toBeAList()
    })

    it('should create a list in the store on insert(undefined)', () => {
      const store = makeStore({})
      const renderField = jest.fn(props => <input {...props.input} />)
      const renderFieldArray = jest.fn(({ fields }) => (
        <div>
          {fields.map(field => (
            <Field name={field} component={renderField} key={field} />
          ))}
          <button onClick={() => fields.insert(0)}>Add Dog</button>
        </div>
      ))
      class Form extends Component {
        render() {
          return <FieldArray name="dogs" component={renderFieldArray} />
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )
      const button = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')

      // only registered field array in store
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: {
              dogs: { name: 'dogs', type: 'FieldArray', count: 1 }
            }
          }
        }
      })

      // length is 0
      expect(renderFieldArray).toHaveBeenCalled()
      expect(renderFieldArray).toHaveBeenCalledTimes(1)
      expect(renderFieldArray.mock.calls[0][0].fields.length).toBe(0)

      // add field
      TestUtils.Simulate.click(button)

      // field array rerendered
      expect(renderFieldArray).toHaveBeenCalledTimes(2)
      expect(renderFieldArray.mock.calls[1][0].fields.length).toBe(1)

      // field rendered
      expect(renderField).toHaveBeenCalled()
      expect(renderField).toHaveBeenCalledTimes(1)
      expect(renderField.mock.calls[0][0].input.name).toBe('dogs[0]')
      expect(renderField.mock.calls[0][0].input.value).toBe('')

      // field registered in store
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            values: {
              dogs: [undefined]
            },
            registeredFields: {
              dogs: { name: 'dogs', type: 'FieldArray', count: 1 },
              'dogs[0]': { name: 'dogs[0]', type: 'Field', count: 1 }
            }
          }
        }
      })

      // values list is a list
      expect(getIn(store.getState(), 'form.testForm.values.dogs')).toBeAList()
    })

    it('should create a list in the store on insert(value)', () => {
      const store = makeStore({})
      const renderField = jest.fn(props => <input {...props.input} />)
      const renderFieldArray = jest.fn(({ fields }) => (
        <div>
          {fields.map(field => (
            <Field name={field} component={renderField} key={field} />
          ))}
          <button onClick={() => fields.insert(0, 'Fido')}>Add Dog</button>
        </div>
      ))
      class Form extends Component {
        render() {
          return <FieldArray name="dogs" component={renderFieldArray} />
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      const dom = TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )
      const button = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')

      // only registered field array in store
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            registeredFields: {
              dogs: { name: 'dogs', type: 'FieldArray', count: 1 }
            }
          }
        }
      })

      // length is 0
      expect(renderFieldArray).toHaveBeenCalled()
      expect(renderFieldArray).toHaveBeenCalledTimes(1)
      expect(renderFieldArray.mock.calls[0][0].fields.length).toBe(0)

      // add field
      TestUtils.Simulate.click(button)

      // field array rerendered
      expect(renderFieldArray).toHaveBeenCalledTimes(2)
      expect(renderFieldArray.mock.calls[1][0].fields.length).toBe(1)

      // field rendered
      expect(renderField).toHaveBeenCalled()
      expect(renderField).toHaveBeenCalledTimes(1)
      expect(renderField.mock.calls[0][0].input.name).toBe('dogs[0]')
      expect(renderField.mock.calls[0][0].input.value).toBe('Fido')

      // field registered in store
      expect(store.getState()).toEqualMap({
        form: {
          testForm: {
            values: {
              dogs: ['Fido']
            },
            registeredFields: {
              dogs: { name: 'dogs', type: 'FieldArray', count: 1 },
              'dogs[0]': { name: 'dogs[0]', type: 'Field', count: 1 }
            }
          }
        }
      })

      // values list is a list
      expect(getIn(store.getState(), 'form.testForm.values.dogs')).toBeAList()
    })

    it('should work with Fields', () => {
      const store = makeStore({
        testForm: {
          values: {
            foo: ['firstValue', 'secondValue']
          }
        }
      })
      const renderField = jest.fn(field => <input key={field.input.name} {...field.input} />)

      const renderFields = jest.fn(({ foo }) => <div>{foo.map(renderField)}</div>)

      const component = jest.fn(({ fields }) => (
        <div>
          <Fields names={fields} component={renderFields} />
        </div>
      ))

      class Form extends Component {
        render() {
          return (
            <div>
              <FieldArray name="foo" component={component} />
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
      expect(renderFields).toHaveBeenCalled()
      expect(renderFields).toHaveBeenCalledTimes(1)
      expect(renderFields.mock.calls[0][0].foo.length).toBe(2)

      expect(renderField).toHaveBeenCalled()
      expect(renderField).toHaveBeenCalledTimes(2)
      expect(renderField.mock.calls[0][0].input.value).toBe('firstValue')
      expect(renderField.mock.calls[1][0].input.value).toBe('secondValue')
    })

    it('should get() actual current value from redux store', () => {
      const store = makeStore({
        testForm: {
          values: {
            dogs: ['Fido', 'Snoopy']
          }
        }
      })
      const renderField = jest.fn(props => <input {...props.input} />)
      const renderFieldArray = jest.fn(({ fields }) => (
        <div>
          {fields.map(field => (
            <Field name={field} component={renderField} key={field} />
          ))}
        </div>
      ))
      class Form extends Component {
        render() {
          return <FieldArray name="dogs" component={renderFieldArray} />
        }
      }
      const TestForm = reduxForm({ form: 'testForm' })(Form)
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <TestForm />
        </Provider>
      )

      // field array rendered
      expect(renderFieldArray).toHaveBeenCalled()
      expect(renderFieldArray).toHaveBeenCalledTimes(1)

      expect(renderFieldArray.mock.calls[0][0].fields.length).toBe(2)
      expect(renderFieldArray.mock.calls[0][0].fields.get(0)).toBe('Fido')

      // change first field
      renderField.mock.calls[0][0].input.onChange('Odie')

      // field array NOT rerendered
      expect(renderFieldArray).toHaveBeenCalledTimes(1)
      expect(renderFieldArray.mock.calls[0][0].fields.length).toBe(2)

      // but get() should get the new value
      expect(renderFieldArray.mock.calls[0][0].fields.get(0)).toBe('Odie')
    })
  })
}

describeFieldArray('FieldArray.plain', plain, plainCombineReducers, () =>
  expect.extend(plainExpectations)
)
describeFieldArray('FieldArray.immutable', immutable, immutableCombineReducers, () =>
  expect.extend(immutableExpectations)
)
