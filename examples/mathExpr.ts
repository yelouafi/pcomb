import { lexeme, lazy, oneOf, eof, Parser } from "../src";

const token = lexeme(/\s*/);

const ops = {
  "+": (left: number, right: number) => left + right,
  "-": (left: number, right: number) => left - right,
  "*": (left: number, right: number) => left * right,
  "/": (left: number, right: number) => left / right
};

  

const number = token(/\d+/)
  .map(x => +x)
  .label("number")

const op_1 = (token(/[\+\-]/) as Parser<"+" | "-">)
  .map(op => ops[op])
  .label("+ or -")

const  op_2 = (token(/[\*\/]/) as Parser<"*" | "/">)
  .map(op => ops[op])
  .label("* or /")

const factor: Parser<number> = lazy(() => oneOf(number, expr.between(token("("), token(")"))))

const term = factor.infixLeft(op_2)

const expr = term.infixLeft(op_1)