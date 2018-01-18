import {
  lexeme, combine, oneOf, lazy, many, eof, pure
} from '../src'

const token = lexeme(/\s*/)

class LambdaExp {

  constructor(type, payload) {
    this.type = type
    Object.assign(this, payload)
  }

  toString() {
    return {
      Sym     : ({name})        => name,
      App     : ({app, arg})    => `(${app} ${arg})`,
      Lambda  : ({param, body}) => `λ${param}.${body}`
    }[this.type](this)
  }
}

const Sym     = name          => new LambdaExp('Sym'  , {name})
const App     = (app, arg)    => new LambdaExp('App'  , {app, arg})
const Lambda  = (body, param) => new LambdaExp('Lambda', {param, body})

const LAMBDA    = token(/[λ\\]/).label('lambda')
const SYM       = token(/[^λ\\\.\(\)\s]+/).label('symbol')
const PERIOD    = token('.')
const LPAREN    = token('(')
const RPAREN    = token(')')

const expr = lazy(() => 
  term.infixLeft(pure(App))
)

const lambda = combine(
  [
    LAMBDA, 
    many(SYM.map(Sym)), 
    PERIOD, 
    expr
  ],
  (_, params, __, body) => params.reduceRight(Lambda, body)
)

const term = oneOf(
  SYM.map(Sym),
  lambda,
  expr.between(LPAREN, RPAREN)
)

export const lambdaCalculus = expr.skip(eof);