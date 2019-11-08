import {
  lexeme,
  apply,
  oneOf,
  lazy,
  many,
  eof,
  pure,
  seq,
  Parser
} from "../src";

const token = lexeme(/\s*/);

export type LambdaExp =
  | { tag: "Var"; name: string }
  | { tag: "App"; app: LambdaExp; arg: LambdaExp }
  | { tag: "Fun"; param: string; body: LambdaExp };

export function Var(name: string): LambdaExp {
  return { tag: "Var", name };
}

export function App(app: LambdaExp, arg: LambdaExp): LambdaExp {
  return { tag: "App", app, arg };
}

export function Fun(param: string, body: LambdaExp): LambdaExp {
  return { tag: "Fun", param, body };
}

const LAMBDA = token(/[λ\\]/).label("lambda");
const SYM = token(/[^λ\\\.\(\)\s]+/).label("symbol");
const PERIOD = token(".");
const LPAREN = token("(");
const RPAREN = token(")");

const expr: Parser<LambdaExp> = lazy(() => term.infixLeft(pure(App)));

const fun = apply(
  (params, body) => params.reduceRight((exp, param) => Fun(param, exp), body),
  seq(LAMBDA, many(SYM)),
  seq(PERIOD, expr)
);

const term = oneOf(SYM.map(Var), fun, expr.between(LPAREN, RPAREN));

export const lambdaExp = expr;
