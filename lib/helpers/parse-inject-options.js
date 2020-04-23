/***************************************************
 * Created by nanyuantingfeng on 2020/4/23 17:22. *
 ***************************************************/
function parseOne(data) {
  if (typeof data === 'string') {
    return () => data
  }

  if (typeof data === 'function') {
    return data
  }
}

function parseOneAsArr(data) {
  const __N = parseOne(data)
  if (__N) return [__N]
}

function parseOneAsMuArr(data) {
  const __N = parseOneAsArr(data)
  if (__N) return [__N]
}

module.exports = function(injected) {
  const __N = parseOneAsMuArr(injected)
  if (__N) return __N

  if (!Array.isArray(injected)) {
    throw new Error(`[Master.options.injected] must be an Array`)
  }

  return injected
    .map(data => {
      const __N = parseOneAsArr(data)
      if (__N) return __N

      if (Array.isArray(data)) {
        const __N = parseOne(data[0])
        if (__N) data[0] = __N
        return data
      }

      return undefined
    })
    .filter(Boolean)
}
