
/* global pcomb */

const {
    text, regex, oneOf
} = pcomb


/*
    csv       = record LINE_BREAK { record }
    record    = field SEPARATOR { field }
    field     = quoted | unquoted
    quoted    = QUOTE { not QUOTE | QUOTE QUOTE } QUOTE
    unquoted  = not [SEPARATOR, LINE_BREAK]
*/


const LINE_BREAK = text('\n')
const SEPARATOR = text(',')

const quoted = regex(/"(?:[^"]|"")*"/)
const unquoted = regex(/[^\n,x]*/) 

const field = oneOf(quoted, unquoted)
const record = field.sepBy(SEPARATOR)
const csv = record.sepBy(LINE_BREAK)