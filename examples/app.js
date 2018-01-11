/* global pcomb */

const {
    token, natural, identifier, lazy, oneOf, apply, many, skip
} = pcomb

/**
  program = block
  block   = '{' stmts '}'
  stmts   = { stmt }
  stmt    = 'if' '('expr')' stmt
          | 'while' '('expr')' stmt
          | block
  
  expr    = expr [ boolOp rel ]
  rel     = arith  relOp arith | arith
  arith   = arith aOp1 aTerm | aTerm
  aTerm   = aTerm aOp2 aFactor | aFactor
  aFactor = ident | ident'[' expr ']' | number | '(' expr ')'

**/

const If = (expr, stmt) => ({type: 'if', expr, stmt})
const While = (expr, stmt) => ({type: 'while', expr, stmt})
const Op = op => (left, right) => ({type: 'op', op, left, right})
const Subscript = (base, subs) => ({ type: 'subs', base, subs })
const Call = (fn, args) => ({ type: 'call', fn, args })
const Ident = name => ({type: 'ident', name})
const Num = num => ({type: 'num', num: +num})
const Stmt = stmt => ({type: 'stmt', stmt})
const Block = stmts => ({type: 'block', stmts})

const LBRACE = token('{')
const RBRACE = token('}')
const LBRAKET = token('[')
const RBRAKET = token(']')
const IF = token('if')
const WHILE = token('while')
const LPAR = token('(')
const RPAR = token(')')
const SEMI_COL = token(';')
const COMMA = token(',')

const ARITH_OP1 = token(/[+-]/)
const ARITH_OP2 = token(/[*\/]/)
const REL_OP = token(/==|<=|>=|<|>/)
const BOOL_OP = token(/&&|\|\|/)
const ASSIGN_OP = token('=')

const number = natural.map(Num)
const ident = identifier(['if', 'while']).map(Ident)

const block = lazy(() => stmts.between(LBRACE, RBRACE)).map(Block)
const stmt = lazy(() => oneOf(ifStmt, whileStmt, block, expr.followedBy(SEMI_COL))).map(Stmt)
const expr = lazy(() => assignExpr)

const arraySubs = expr.between(LBRAKET, RBRAKET).map(subs => base => Subscript(base, subs) )
const funcArgs = expr.sepBy(COMMA).between(LPAR, RPAR).map(args => fn => Call(fn, args))

const identOrCallOrSubs = apply(
  (v, fs) => fs.reduce((acc, f) => f(acc), v),
  [ ident,
    many(oneOf(funcArgs, arraySubs))
  ]
)

const factor = oneOf(
  identOrCallOrSubs,
  number,
  expr.between(LPAR, RPAR)
)

const term = factor.infixLeft(ARITH_OP2.map(Op))
const arithExpr = term.infixLeft(ARITH_OP1.map(Op))
const relExpr = arithExpr.infixLeft(REL_OP.map(Op))
const boolExpr = relExpr.infixLeft(BOOL_OP.map(Op))
const assignExpr = boolExpr.infixRight(ASSIGN_OP.map(Op))

const ifStmt = apply(If, [skip(IF), expr.between(LPAR, RPAR), stmt])
const whileStmt = apply(While, [skip(WHILE), expr.between(LPAR, RPAR), stmt])
const stmts = many(stmt)

const program = stmts
