// @flow
const splice = (array: Array<any>, index: number, removeNum: number, value: any): Array<any> => {
  array = array || []

  if (index < array.length) {
    if (value === undefined && !removeNum) {
      // inserting undefined
      const copy = [...array]
      copy.splice(index, 0, true) // temporary placeholder
      copy[index] = undefined // set to undefined
      return copy
    }
    if (Array.isArray(value)) {
      const copy = [...array]
      copy.splice(index, removeNum, ...value) // removing and adding
      return copy
    }
    const copy = [...array]
    copy.splice(index, removeNum) // removing
    return copy
  }
  if (removeNum) {
    // trying to remove non-existant item: return original array
    return array
  }
  // trying to add outside of range: just set value
  const copy = [...array]
  if (Array.isArray(value)) {
    value.forEach(value => (copy[index++] = value))
  } else {
    copy[index] = value
  }
  return copy
}

export default splice
