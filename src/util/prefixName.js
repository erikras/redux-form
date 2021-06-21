// @flow
import type { ReactContext } from '../types'

const formatName = (
  { _reduxForm: { sectionPrefix } }: ReactContext,
  name: string
) => {
  if (sectionPrefix) {
    const nameSuffix = name !== '' && name !== undefined ? `.${name}` : ''

    return `${sectionPrefix}${nameSuffix}`
  }
  return name
}

export default formatName
