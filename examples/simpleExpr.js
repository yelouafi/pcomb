import { lexeme, lazy, oneOf, eof } from "../dist/pcomb.dev";

const token = lexeme(/\s*/);

const ops = {
  "+": (left, right) => left + right,
  "-": (left, right) => left - right,
  "*": (left, right) => left * right,
  "/": (left, right) => left / right
};

const number = token(/\d+/)
  .map(x => +x)
  .label("number");

const op_1 = token(/[\+\-]/)
  .map(op => ops[op])
  .label("+, -");

const op_2 = token(/[\*\/]/)
  .map(op => ops[op])
  .label("*, /");

const expr = lazy(() => term.infixLeft(op_1));

const factor = oneOf(number, expr.between(token("("), token(")")));

const term = factor.infixLeft(op_2);
export const simpleExpr = expr.skip(eof);
