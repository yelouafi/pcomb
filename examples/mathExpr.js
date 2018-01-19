import { lexeme, lazy, oneOf, eof, language } from "../src";

const token = lexeme(/\s*/);

const ops = {
  "+": (left, right) => left + right,
  "-": (left, right) => left - right,
  "*": (left, right) => left * right,
  "/": (left, right) => left / right
};

export const { mathExpr } = language({
  mathExpr: r => r.expr.skip(eof),

  expr: r => r.term.infixLeft(r.op_1),

  term: r => r.factor.infixLeft(r.op_2),

  factor: r => oneOf(r.number, r.expr.between(token("("), token(")"))),

  number: token(/\d+/)
    .map(x => +x)
    .label("number"),

  op_1: token(/[\+\-]/)
    .map(op => ops[op])
    .label("+ -"),

  op_2: token(/[\*\/]/)
    .map(op => ops[op])
    .label("* /")
});
