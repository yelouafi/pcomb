import { mathExpr } from "./mathExpr";
import { polynomial } from "./polynomial";
import { imperative } from "./imperative";
import { lambdaCalculus } from "./lambdaCalculus";
import { json } from "./json";
import { csv } from "./csv";

const parsers = {
  mathExpr,
  polynomial,
  imperative,
  lambdaCalculus,
  json,
  csv
};

const $selectParser = document.querySelector("select");
const $input = document.querySelector("textarea");
const $parse = document.querySelector("button");
const $result = document.querySelector("pre");

let currentParser = getSelectedParser();

function getSelectedParser() {
  return $selectParser.selectedIndex >= 0
    ? parsers[$selectParser.value]
    : mathExpr;
}

$selectParser.onchange = () => {
  currentParser = getSelectedParser();
  $input.value = "";
  $result.textContent = "";
  $result.classList.toggle("error", false);
  $input.focus();
};

$parse.onclick = () => {
  const source = $input.value;
  try {
    const result = currentParser.parse(source);
    $result.textContent = JSON.stringify(result);
    $result.classList.toggle("error", false);
    console.log(result);
  } catch (err) {
    console.error(err);
    $result.textContent = err.message;
    $result.classList.toggle("error", true);
  }
};
