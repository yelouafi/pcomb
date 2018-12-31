export {
  Parser,
  pure,
  fail,
  text,
  regex,
  eof,
  map,
  apply,
  oneOf,
  chain,
  go,
  label,
  lazy,
  many,
  tryp
} from "./base";

import {
  Parser,
  ParserState,
  ParserResult,
  SUCCESS,
  MISMATCH,
  FAILURE
} from "./base";

export const PSUCCESS = "Success";
export const PERROR = "Error";

export interface XYPosition {
  line: number;
  column: number;
}

export type FParseResult<A> =
  | {
      type: typeof PSUCCESS;
      result: A;
    }
  | {
      type: typeof PERROR;
      position: XYPosition;
      message: string;
      expectedTokens: string[];
    };

export function success<T>(result: T): FParseResult<T> {
  return { type: PSUCCESS, result };
}

export function parse<A>(p: Parser<A>, input: string): FParseResult<A> {
  const initState: ParserState = {
    position: 0,
    expectedTokens: []
  };

  const presult = p(input, initState);
  if (presult.type === SUCCESS) {
    return {
      type: PSUCCESS,
      result: presult.result
    };
  } else if (presult.type === MISMATCH) {
    const xyPos = getXYPosition(input, presult.state.position);
    return {
      type: PERROR,
      message: `Unexpected token at line ${xyPos.line}, column: ${xyPos.line}`,
      position: xyPos,
      expectedTokens: presult.state.expectedTokens
    };
  } else {
    return {
      type: PERROR,
      message: presult.message,
      position: getXYPosition(input, presult.state.position),
      expectedTokens: presult.state.expectedTokens
    };
  }
}

function getXYPosition(input: string, position: number): XYPosition {
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
