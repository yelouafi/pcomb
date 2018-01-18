import { text, regex, oneOf, eof } from "../dist/pcomb.dev";

const LINE_BREAK = text("\n");
const SEPARATOR = text(",");

export const quoted = regex(/"(?:[^"]|"")*"/);
export const unquoted = regex(/[^\n,]*/);

export const field = oneOf(quoted, unquoted);
const record = field.sepBy(SEPARATOR);

export const csv = record.sepBy(LINE_BREAK).skip(eof);
