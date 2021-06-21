import prefixName from '../prefixName'

describe('prefixName', () => {
  it('should concat sectionPrefix and name', () => {
    const context = {
      _reduxForm: {
        sectionPrefix: 'foo'
      }
    }
    expect(prefixName(context, 'bar')).toBe('foo.bar')
  })

  it('should ignore empty sectionPrefix', () => {
    const context = {
      _reduxForm: {
        sectionPrefix: undefined
      }
    }
    expect(prefixName(context, 'bar')).toBe('bar')
  })

  it('should ignore empty name', () => {
    const context = {
      _reduxForm: {
        sectionPrefix: 'foo'
      }
    }
    expect(prefixName(context, '')).toBe('foo')
  })

  it('should handle name = 0', () => {
    const context = {
      _reduxForm: {
        sectionPrefix: 'foo'
      }
    }
    expect(prefixName(context, 0)).toBe('foo.0')
  })

  it('should handle name = undefined', () => {
    const context = {
      _reduxForm: {
        sectionPrefix: 'foo'
      }
    }
    expect(prefixName(context)).toBe('foo')
  })
})
