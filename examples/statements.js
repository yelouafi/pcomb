import {
  lexeme,
  lazy,
  oneOf,
  combine,
  many,
  seq
} from "../src";

const token = lexeme(/\s*/);

const keywords = ["if", "while"];

const If = (expr, stmt) => ({ type: "if", expr, stmt });
const While = (expr, stmt) => ({ type: "while", expr, stmt });
const Op = op => (left, right) => ({ type: "op", op, left, right });
const Subscript = (base, subs) => ({ type: "subs", base, subs });
const Call = (fn, args) => ({ type: "call", fn, args });
const Ident = name => ({ type: "ident", name });
const Num = num => ({ type: "num", num: +num });
const Stmt = stmt => ({ type: "stmt", stmt });
const Block = stmts => ({ type: "block", stmts });

const LBRACE = token("{");
const RBRACE = token("}");
const LBRAKET = token("[");
const RBRAKET = token("]");
const IF = token("if");
const WHILE = token("while");
const LPAR = token("(");
const RPAR = token(")");
const SEMI_COL = token(";");
const COMMA = token(",");

const ARITH_OP1 = token(/[+-]/).label("+ , -");
const ARITH_OP2 = token(/[*\/]/).label("* , /");
const REL_OP = token(/==|<=|>=|<|>/).label("== , <= , >= , < , >");
const BOOL_OP = token(/&&|\|\|/).label("&& , || ");
const ASSIGN_OP = token("=");

const number = token(/\d+(?:\.\d+)?(?:[eE][-+]?\d+)?/)
  .map(x => +x)
  .map(Num)
  .label("number");

const ident = token(/[a-zA-Z]+/)
  .guard(x => !keywords.includes(x))
  .map(Ident)
  .label("ident");

const block = lazy(() => stmts.between(LBRACE, RBRACE)).map(Block);

const stmt = lazy(() =>
  oneOf(ifStmt, whileStmt, block, expr.skip(SEMI_COL))
).map(Stmt);

const expr = lazy(() => assignExpr);

const arraySubs = expr
  .between(LBRAKET, RBRAKET)
  .map(subs => base => Subscript(base, subs));

const funcArgs = expr
  .sepBy(COMMA)
  .between(LPAR, RPAR)
  .map(args => fn => Call(fn, args));

const identOrCallOrSubs = combine(
  [ident, many(oneOf(funcArgs, arraySubs))],
  (v, fs) => fs.reduce((acc, f) => f(acc), v)
);

const factor = oneOf(identOrCallOrSubs, number, expr.between(LPAR, RPAR));

const term = factor.infixLeft(ARITH_OP2.map(Op));

const arithExpr = term.infixLeft(ARITH_OP1.map(Op));

const relExpr = arithExpr.infixLeft(REL_OP.map(Op));

const boolExpr = relExpr.infixLeft(BOOL_OP.map(Op));

const assignExpr = boolExpr.infixRight(ASSIGN_OP.map(Op));

const ifStmt = combine([seq(IF, expr.between(LPAR, RPAR)), stmt], If);

const whileStmt = combine([seq(WHILE, expr.between(LPAR, RPAR)), stmt], While);

const stmts = many(stmt);

export const program = stmts;
