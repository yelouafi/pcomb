import { text, regex, oneOf, eof } from "../src";

const LINE_BREAK = text("\n");
const SEPARATOR = text(",");

export const quoted = regex(/"(?:[^"]|"")*"/).map(s =>
  s.slice(1, s.length - 1).replace(/""/g, '"')
);
export const unquoted = regex(/[^\n,]*/);

export const field = oneOf(quoted, unquoted);
const record = field.sepBy(SEPARATOR);

export const csv = record.sepBy(LINE_BREAK).skip(eof);