import {
  text,
  regex,
  oneOf,
  eof,
  Parser,
  SUCCESS,
  MISMATCH,
  pure
} from "./index";

import { csv } from "../examples/csv";
import {
  json,
  pair,
  number,
  value,
  members,
  object,
  array
} from "../examples/json";

function parseError(position: number, expectedTokens: string[]) {
  return [position, expectedTokens];
}

function parse<A>(p: Parser<A>, input: string) {
  let result = p.skip(eof).parse(input);
  if (result.type === SUCCESS) return result.value;
  if (result.type === MISMATCH)
    return parseError(result.state.position, result.state.expectedTokens);
  return result.message;
}

test("csv", () => {
  expect(
    parse(
      csv,
      "Year,Make,Model,Description,Price\n" +
        '1997,Ford,E350,"ac, abs, moon",3000.00'
    )
  ).toEqual([
    ["Year", "Make", "Model", "Description", "Price"],
    ["1997", "Ford", "E350", "ac, abs, moon", "3000.00"]
  ]);
});

test("json", () => {
  const data = [
    "{",
    ' "glossary": {',
    '   "title": "example glossary",',
    '   "GlossDiv": {',
    '     "title": "S",',
    '     "GlossList": {',
    '       "GlossEntry": {',
    '         "ID": "SGML",',
    '         "SortAs": "SGML",',
    '         "GlossTerm": "Standard Generalized Markup Language",',
    '         "Acronym": "SGML",',
    '         "Abbrev": "ISO 8879:1986",',
    '         "GlossDef": {',
    '           "para": "A meta-markup language",',
    '           "GlossSeeAlso": ["GML", "XML"]',
    "         },",
    '         "GlossSee": "markup"',
    "       }",
    "     }",
    "   }",
    " }",
    "}"
  ].join("\n");

  expect(parse(json, data)).toEqual(JSON.parse(data));
});
