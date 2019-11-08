import {
  Parser,
  eof,
  SUCCESS,
  MISMATCH} from "../src/index";

export function parseError(position: number, expectedTokens: string[]) {
  return [position, expectedTokens];
}

export function parse<A>(p: Parser<A>, input: string) {
  let result = p.skip(eof).parse(input);
  if (result.type === SUCCESS) return result.value;
  if (result.type === MISMATCH)
    return parseError(result.state.position, result.state.expectedTokens);
  return result.message;
}