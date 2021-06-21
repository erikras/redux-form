// @flow
import { List } from 'immutable'
import type { List as ImmutableList } from 'immutable'

export default (list: ImmutableList<any>, index: number, removeNum: number, value: any) => {
  list = List.isList(list) ? list : List()

  if (index < list.count()) {
    if (value === undefined && !removeNum) {
      // inserting undefined
      // first insert true and then re-set it to undefined
      return list
        .splice(index, 0, true) // placeholder
        .set(index, undefined)
    }
    if (Array.isArray(value)) {
      return list.splice(index, removeNum, ...value) // removing and adding
    } else {
      return list.splice(index, removeNum) // removing
    }
  }
  if (removeNum) {
    // trying to remove non-existant item: return original array
    return list
  }
  // trying to add outside of range: just set value
  if (Array.isArray(value)) {
    value.forEach(value => (list = list.set(index++, value)))
  } else {
    list = list.set(index, value)
  }
  return list
}
