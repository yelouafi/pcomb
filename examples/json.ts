import { lexeme, oneOf, collect, lazy, Parser, text } from "../src";

const token = lexeme(/\s*/);

type Jatom = number | string | boolean | null;
type Jobject = {
  [key: string]: Jvalue;
};
type Jvalue = Jatom | Jarray | Jobject;

interface Jarray extends Array<Jvalue> {}

function unquote(s: string) {
  return s.substring(1, s.length - 1);
}

function objectFromPairs(pairs: [string, Jvalue][]) {
  return pairs.reduce(
    (obj, [name, value]) => {
      obj[name] = value;
      return obj;
    },
    {} as Jobject
  );
}

const COLON = token(":");
const COMMA = token(",");
const LBRACE = token("{");
const RBRACE = token("}");
const LBRAKET = token("[");
const RBRAKET = token("]");
const NULL = token("null").mapTo(null);
const TRUE = token("true").mapTo(true);
const FALSE = token("false").mapTo(false);

export const value: Parser<Jvalue> = lazy(() =>
  oneOf<Jvalue>(string, number, object, array, NULL, TRUE, FALSE)
);

export const number = token(/-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?/)
  .map(x => +x)
  .label("number");

export const string = token(/"(?:[^"\\]|\\"|\\\\|\\\/|\\b|\\f|\\r|\\n|\\t])*"/)
  .map(unquote)
  .label("string");

export const pair = collect(string.skip(COLON), value);

export const members = pair.sepBy(COMMA).map(objectFromPairs);

export const object = members.between(LBRACE, RBRACE);

export const array = value.sepBy(COMMA).between(LBRAKET, RBRAKET);

export const json = oneOf<Jvalue>(object, array);
