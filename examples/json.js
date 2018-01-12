
/* global pcomb */

const {
  token, oneOf, seq, lazy
} = pcomb

function unquote(s) {
  return s.substring(1, s.length - 1)
}


function objectFromPairs(pairs) {
  return pairs.reduce((obj, [name, value]) => {
    obj[name] = value
    return obj
  }, {})
}


const COLON = token(':')
const COMMA = token(',')
const LBRACE = token('{')
const RBRACE = token('}')
const LBRAKET = token('[')
const RBRAKET = token(']')
const NULL = token('null').mapTo(null)
const TRUE = token('true').mapTo(true)
const FALSE = token('false').mapTo(false)

const value = lazy(() =>
  oneOf(string, number, object, array, NULL, TRUE, FALSE)
)

const number = token(/-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?/).map(x => +x)
const string = token(/"(?:[^"\\]|\\"|\\\\|\\\/|\\b|\\f|\\r|\\n|\\t])*"/).map(unquote)
const pair = seq(string, COLON.skip(), value)
const members = pair.sepBy(COMMA).map(objectFromPairs)
const array = value.sepBy(COMMA).between(LBRAKET, RBRAKET)
const object = members.between(LBRACE, RBRACE)
const json = oneOf(array, object)