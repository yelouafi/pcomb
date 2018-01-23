import {
  lexeme,
  oneOf,
  combine,
  many,
  seq,
  maybe,
  language,
  eof,
  apply,
  setState,
  pure
} from "../src";

const token = lexeme(/\s*/);

const keywords = [
  "if",
  "while",
  "function",
  "var",
  "return",
  "true",
  "false",
  "null"
];

const VarDeclaration = (identifier, init) => ({
  type: "var_declaration",
  identifier,
  init
});

const FuncDeclaration = (identifier, params, body) => ({
  type: "func_declaration",
  identifier,
  params,
  body
});

const ArrayLiteral = elements => ({
  type: "array_literal",
  elements
});

const ObjectLiteral = properties => ({
  type: "object_literal",
  properties
});

const If = (cond, then, elze) => ({ type: "if", cond, then, elze });

const While = (cond, block) => ({ type: "while", cond, block });

const Return = expr => ({ type: "return", expr });

const ArraySubscript = subscript => base => ({
  type: "array_subscript",
  base,
  subscript
});

const PropertySubscript = subscript => base => ({
  type: "property_subscript",
  base,
  subscript
});

const FuncCall = args => func => ({ type: "func_call", func, args });

const Identifier = name => ({ type: "identifier", name });
const Str = value => ({ type: "string", value });
const Num = value => ({ type: "number", value: +value });
const Bool = value => ({ type: "boolean", value: +value });
const Null = { type: "null" };
const Block = statements => ({ type: "block", statements });

const Op = type => operator => (left, right) => ({
  type,
  operator,
  left,
  right
});
const ArithmeticOp = Op("arithmetic_operation");
const RelationalOp = Op("relational_operation");
const BooleanOp = Op("boolean_operation");
const Assignement = Op("assignement")("=");

function isAssignable(node) {
  return (
    node.type === "identifier" ||
    node.type === "array_subscript" ||
    node.type === "property_subscript"
  );
}

const LBRACE = token("{");
const RBRACE = token("}");
const LBRAKET = token("[");
const RBRAKET = token("]");
const IF = token("if");
const ELSE = token("else");
const WHILE = token("while");
const RETURN = token("return");
const LPAR = token("(");
const RPAR = token(")");
const COLON = token(":");
const SEMI_COL = token(";");
const COMMA = token(",");
const PERIOD = token(".");
const VAR = token("var");
const FUNCTION = token("function");

const ARITH_OP1 = token(/[+-]/).label("+ -");
const ARITH_OP2 = token(/[*\/]/).label("* /");
const REL_OP = token(/==|<=|>=|<|>/).label("== <= >= < >");
const BOOL_OP = token(/&&|\|\|/).label("&& ||");
const ASSIGN_OP = token("=");

export const { imperative } = language({
  imperative(r) {
    return r.statementList.skip(eof);
  },

  statementList(r) {
    return many(r.statement);
  },

  statement(r) {
    return oneOf(
      r.ifStmt,
      r.whileStmt,
      r.returnStmt.skip(SEMI_COL),
      r.varDeclaration.skip(SEMI_COL),
      r.funcDeclaration,
      r.block,
      r.expression.skip(SEMI_COL)
    );
  },

  ifStmt(r) {
    return apply(If, [
      seq(IF, r.expression.between(LPAR, RPAR)),
      r.statement,
      maybe(seq(ELSE, r.statement))
    ]);
  },

  whileStmt(r) {
    return apply(While, [
      seq(WHILE, r.expression.between(LPAR, RPAR)),
      r.statement
    ]);
  },

  returnStmt(r) {
    return seq(
      RETURN.guard(
        (_, state) => state.inFunctionBody,
        "return can only occur inside a function declaration"
      ),
      maybe(r.expression)
    ).map(Return);
  },

  block(r) {
    return r.statementList.between(LBRACE, RBRACE).map(Block);
  },

  varDeclaration(r) {
    return apply(VarDeclaration, [
      seq(VAR, r.ident),
      seq(ASSIGN_OP, r.expression).orElse(pure(null))
    ]);
  },

  funcDeclaration(r) {
    return apply(FuncDeclaration, [
      seq(FUNCTION, r.ident),
      r.ident.sepBy(COMMA).between(LPAR, RPAR),
      r.block.between(
        setState({ inFunctionBody: true }),
        setState({ inFunctionBody: false })
      )
    ]);
  },

  expression(r) {
    return oneOf(r.arrayLiteral, r.objectLiteral, r.assignExpr);
  },

  arrayLiteral(r) {
    return r.expression
      .sepBy(COMMA)
      .between(LBRAKET, RBRAKET)
      .map(ArrayLiteral);
  },

  objectLiteral(r) {
    return r.objectProperty
      .sepBy(COMMA)
      .between(LBRACE, RBRACE)
      .map(ObjectLiteral);
  },

  objectProperty(r) {
    return apply((name, value) => ({ name, value }), [
      r.ident.skip(COLON),
      r.expression
    ]);
  },

  *assignExpr(r) {
    let leftHandSide = yield r.boolExpr;

    const assignOp = yield maybe(ASSIGN_OP).guard(
      op => op == null || isAssignable(leftHandSide),
      "left side of '=' must be an identifier or an array subscript"
    );

    if (assignOp != null) {
      return Assignement(leftHandSide, yield r.assignExpr);
    }
    return leftHandSide;
  },

  boolExpr(r) {
    return r.relExpr.infixLeft(BOOL_OP.map(BooleanOp));
  },

  relExpr(r) {
    return r.arithExpr.infixLeft(REL_OP.map(RelationalOp));
  },

  arithExpr(r) {
    return r.term.infixLeft(ARITH_OP1.map(ArithmeticOp));
  },

  term(r) {
    return r.factor.infixLeft(ARITH_OP2.map(ArithmeticOp));
  },

  factor(r) {
    return oneOf(
      r.identOrCallOrSubs,
      r.string,
      r.number,
      r.tru,
      r.fals,
      r.nul,
      r.expression.between(LPAR, RPAR)
    );
  },

  identOrCallOrSubs(r) {
    return combine(
      [r.ident, many(oneOf(r.funcArgs, r.arraySubscript, r.propertySubscript))],
      (v, fs) => fs.reduce((acc, f) => f(acc), v)
    );
  },

  funcArgs(r) {
    return r.expression
      .sepBy(COMMA)
      .between(LPAR, RPAR)
      .map(FuncCall);
  },

  arraySubscript(r) {
    return r.expression.between(LBRAKET, RBRAKET).map(ArraySubscript);
  },

  propertySubscript(r) {
    return seq(PERIOD, r.identOrCallOrSubs).map(PropertySubscript);
  },

  number: token(/\d+(?:\.\d+)?(?:[eE][-+]?\d+)?/)
    .map(x => +x)
    .map(Num)
    .label("number"),

  string: token(/"(?:[^"]|\\")*"/)
    .map(Str)
    .label("string"),

  tru: token("true").map(Bool),

  fals: token("false").map(Bool),

  nul: token("null").mapTo(Null),

  ident: token(/[a-zA-Z]+/)
    .guard(x => !keywords.includes(x))
    .map(Identifier)
    .label("identifier")
});
