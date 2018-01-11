
export const EMPTY_RESULT = { toString: () => 'EMPTY' }

export const isEmpty = r => r === EMPTY_RESULT

export function isPrimitive(v) {
  const type = typeof v
  return type === 'string' || type === 'number' || type === 'boolean'
}

export const id = x => x

export const first = id

export const second = (_,y) => y

export function sliceCr(str, pos) {
  const crIdx = str.indexOf('\n', pos.offset)
  if(crIdx >= 0) {
    return str.slice(pos.offset, crIdx)
  }
  return str.slice(pos.offset)
}

