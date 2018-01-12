
/* global pcomb */

const {
  text, regex, oneOf
} = pcomb


const LINE_BREAK = text('\n')
const SEPARATOR = text(',')

const quoted = regex(/"(?:[^"]|"")*"/)
const unquoted = regex(/[^\n,x]*/) 

const field = oneOf(quoted, unquoted)
const record = field.sepBy(SEPARATOR)
const csv = record.sepBy(LINE_BREAK)