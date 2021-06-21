// @flow
import isEvent from './isEvent'
import type { Event, OptimisticSyntheticDragEvent } from '../types'

const getSelectedValues = options => {
  const result = []
  if (options) {
    for (let index = 0; index < options.length; index++) {
      const option = options[index]
      if (option.selected) {
        result.push(option.value)
      }
    }
  }
  return result
}

const getValue = (event: Event, isReactNative: ?boolean) => {
  if (isEvent(event)) {
    if (
      !isReactNative &&
      event.nativeEvent &&
      // $FlowFixMe: react-native has no useful flow types, and this is a compatibility fix for when isReactNative is not properly set
      event.nativeEvent.text !== undefined
    ) {
      return event.nativeEvent.text
    }
    if (isReactNative && event.nativeEvent !== undefined) {
      // $FlowFixMe: react-native has no useful flow types
      return event.nativeEvent.text
    }

    const {
      target: { type, value, checked, files }
    } = event
    if (type === 'checkbox') {
      return !!checked
    }
    if (type === 'file') {
      if (files) {
        return files
      } else if (event.dataTransfer) {
        // events are inexact types, so flow doesn't infer drag event type from existence of event.dataTransfer
        const dragEvent: OptimisticSyntheticDragEvent = (event: any)
        return dragEvent.dataTransfer.files
      } else {
        return undefined
      }
    }
    if (type === 'select-multiple') {
      const multiSelect: HTMLSelectElement = (event.target: any)
      return getSelectedValues(multiSelect.options)
    }
    return value
  }
  return event
}

export default getValue
