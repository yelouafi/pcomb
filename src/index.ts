export * from "./base";

import { Parser, ParserState, ParserResult } from "./base";

export interface XYPosition {
  line: number;
  column: number;
}

export const initialState: ParserState = {
  position: 0,
  expectedTokens: []
};

export function parse<A>(p: Parser<A>, input: string): ParserResult<A> {
  return p(input, initialState);
}

export function getXYPosition(input: string, position: number): XYPosition {
  if (input.length < position) throw new Error("Bad position!");

  let offset = 0;
  let line = 0;
  let column = position;
  while (offset < position) {
    const newLineIndex = input.indexOf("\n", offset);
    if (newLineIndex < 0 || newLineIndex >= position) break;
    line++;
    column = position - newLineIndex - 1;
    offset = newLineIndex + 1;
  }

  return { line: line + 1, column: column + 1 };
}
