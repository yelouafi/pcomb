import { json } from "./json";
import { parse } from "../test/utils";

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
