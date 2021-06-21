import { fromJS, List } from 'immutable'
import splice from '../splice'

describe('structure.immutable.splice', () => {
  const testInsertWithValue = value => {
    const argval = value === undefined ? value : [value]
    it('should insert even when initial array is undefined', () => {
      const structure = splice(undefined, 2, 0, argval)
      expect(structure).toBeInstanceOf(List)
      expect(structure).toEqual(fromJS([undefined, undefined, value]))
    })

    it('should insert at start', () => {
      const structure = splice(fromJS(['b', 'c', 'd']), 0, 0, argval)
      expect(structure).toBeInstanceOf(List)
      expect(structure).toEqual(fromJS([value, 'b', 'c', 'd']))
    })

    it('should insert at end', () => {
      const structure = splice(fromJS(['a', 'b', 'c']), 3, 0, argval)
      expect(structure).toBeInstanceOf(List)
      expect(structure).toEqual(fromJS(['a', 'b', 'c', value]))
    })

    it('should insert in middle', () => {
      const structure = splice(fromJS(['a', 'b', 'd']), 2, 0, argval)
      expect(structure).toBeInstanceOf(List)
      expect(structure).toEqual(fromJS(['a', 'b', value, 'd']))
    })

    it('should insert in out of range', () => {
      const structure = splice(fromJS(['a', 'b', 'c']), 5, 0, argval)
      expect(structure).toBeInstanceOf(List)
      expect(structure).toEqual(
        fromJS(['a', 'b', 'c', undefined, undefined, value])
      )
    })
  }

  testInsertWithValue('value')
  testInsertWithValue(undefined)

  it('should return empty array when removing and initial array is undefined', () => {
    const structure = splice(undefined, 2, 1)
    expect(structure).toBeInstanceOf(List)
    expect(structure).toEqual(fromJS([]))
  })

  it('should remove at start', () => {
    const structure = splice(fromJS(['a', 'b', 'c', 'd']), 0, 1)
    expect(structure).toBeInstanceOf(List)
    expect(structure).toEqual(fromJS(['b', 'c', 'd']))
  })

  it('should remove in the middle then insert in that position', () => {
    const structure = splice(fromJS(['a', 'b', 'c', 'd']), 1, 1, ['e'])
    expect(structure).toBeInstanceOf(List)
    expect(structure).toEqual(fromJS(['a', 'e', 'c', 'd']))
  })

  it('should remove at end', () => {
    const structure = splice(fromJS(['a', 'b', 'c', 'd']), 3, 1)
    expect(structure).toBeInstanceOf(List)
    expect(structure).toEqual(fromJS(['a', 'b', 'c']))
  })

  it('should remove in middle', () => {
    const structure = splice(fromJS(['a', 'b', 'c', 'd']), 2, 1)
    expect(structure).toBeInstanceOf(List)
    expect(structure).toEqual(fromJS(['a', 'b', 'd']))
  })
})
