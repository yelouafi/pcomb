import { mathExpr } from "./mathExpr";
import { polynomial } from "./polynomial";
import { imperative } from "./imperative";
import { lambdaCalculus } from "./lambdaCalculus";
import { css } from "./css";
import { json } from "./json";
import { csv } from "./csv";

const parsers = {
  mathExpr,
  polynomial,
  imperative,
  lambdaCalculus,
  css,
  json,
  csv
};

const examples = {
  mathExpr: "1 + 2 * 3 - (4 / 2)",
  polynomial: "2x^3 - x^2 + 3x - 22",
  imperative: [
    "var x = 10;\n",
    "function factorial(n) {",
    "  if(n <= 1) {",
    "    return 1;",
    "  }",
    "  return n * factorial(n - 1);",
    "}"
  ].join("\n"),
  lambdaCalculus: "\\g.(\\x.(g (x x)) \\x.(g (x x)))",
  css: ".a, div#b.c, input[value='hi']",
  json: [
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
  ].join("\n"),
  csv: [
    "Year,Make,Model,Description,Price",
    '1997,Ford,E350,"ac, abs, moon",3000.00',
    '1999,Chevy,"Venture ""Extended Edition""","",4900.00',
    '1999,Chevy,"Venture ""Extended Edition, Very Large""",,5000.00',
    '1996,Jeep,Grand Cherokee,"MUST SELL!',
    'air, moon roof, loaded",4799.00'
  ].join("\n")
};

const $selectParser = document.querySelector("select");
const $input = document.querySelector("textarea");
const $parse = document.querySelector("button");
const $result = document.querySelector("pre");

$selectParser.onchange = setParser;
$parse.onclick = doParse;

let currentParser, example;

function getSelectedParser() {
  return $selectParser.selectedIndex >= 0
    ? [parsers[$selectParser.value], examples[$selectParser.value]]
    : [mathExpr, examples.mathExpr];
}

function setParser() {
  [currentParser, example] = getSelectedParser();
  $input.value = example;
  doParse();
  $input.focus();
}

function doParse() {
  const source = $input.value;
  try {
    const result = currentParser.parse(source);
    $result.textContent = JSON.stringify(result, null, "  ");
    $result.classList.toggle("error", false);
    console.log(result);
  } catch (err) {
    console.error(err);
    $result.textContent = err.message;
    $result.classList.toggle("error", true);
  }
}

setParser();
