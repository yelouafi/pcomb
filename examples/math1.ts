import { lexeme, lazy, oneOf, eof, lang, Parser } from "../src";

const token = lexeme(/\s*/);


type OpMap = {
  [key: string]: (left: number, right: number) => number

}

const ops: OpMap = {
  "+": (left: number, right: number) => left + right,
  "-": (left: number, right: number) => left - right,
  "*": (left: number, right: number) => left * right,
  "/": (left: number, right: number) => left / right
};

export const r = lang({
  number() {
    return token(/\d+/)
    .map(x => +x)
    .label("number")
  },

  op_1() {
    return token(/[\+\-]/).map(op => ops[op])
  },

  op_2() {
    return token(/[\*\/]/)
    .map(op => ops[op])
    .label("* or /")
  },

  factor(): Parser<number> {
    return oneOf(r.number, r.expr.between(token("("), token(")")))
  },

  expr(): Parser<number> {
    return r.factor.infixLeft(r.op_1)
  }
});