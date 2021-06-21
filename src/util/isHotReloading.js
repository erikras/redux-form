// @flow
const isHotReloading = (): boolean => {
  const castModule: any = typeof module !== 'undefined' && module
  return !!(
    castModule &&
    castModule.hot &&
    typeof castModule.hot.status === 'function' &&
    castModule.hot.status() === 'apply'
  )
}

export default isHotReloading
