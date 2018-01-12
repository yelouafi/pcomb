import { EMPTY_RESULT, id, isEmpty, isPrimitive, first, second, sliceCr } from './utils'

// Position :: { line: number, column: number, offset: number }
class Position {
  constructor(line, column, offset) {
    this.line = line
    this.column = column
    this.offset = offset
  }

  consume(text) {
    const length = text.length
    if(length === 0) return this

    const {line, column, offset} = this
    if(text.indexOf('\n') < 0) {
      return new Position(line, column + length, offset + length)
    }
    
    const lines = text.split('\n')
    const breaks = lines.length - 1
    const lastWidth = lines[breaks].length
    return new Position(
      line + breaks,
      breaks > 0 ? lastWidth : column + lastWidth,
      offset + length
    )
  }

  toString() {
    return `Line ${this.line}, Column: ${this.column}`
  }
}

Position.ZERO = new Position(0,0,0)

/**
  ParseResult e a :: 
    Success { start: Position, end: Position, data: a }
    Failure { start: Position, expected: e }
**/

// Success :: (Position, Position, a) -> ParseResult e a
function Success(start, end, data) {
  return {start, end, data}
}

// Failure :: (Position, e) -> ParseResult e a
function Failure(start, expected) {
  return {isFailure: true, start, expected}
}

// Parser s a :: { run :: (s, Position) -> ParseResult a }
class Parser {

  as(name) {
    this.$name = name
  }

  run() {
    throw new Error('Abstract!')
  }
  
  parse(s) {
    const result = this.run(s, Position.ZERO)
    if(result.isFailure) {
      throw new Error(
        `Parse error at ${result.start}. 
        Unexpected '${sliceCr(s, result.start)}'
      `)
    }
    
    if(s.length !== result.end.offset) {
      throw new Error(
        `Parse error at ${result.end}. 
        Unexpected '${sliceCr(s, result.end)}'
      `)
    }
    return result.data
  }

  // skip :: Parser s a -> Parser s EMPTY_RESULT
  skip() {
    if(!this._skip) {
      this._skip = this.mapTo(EMPTY_RESULT)
    }
    return this._skip
  }

  // lookAhead :: Parser s a -> Parser s a
  lookAhead() {
    if(!this._lookAhead) {
      this._lookAhead = new LookAheadParser(this)
    }
    return this._lookAhead
  }

  // fail :: Parser s a -> Parser s a
  fail() {
    if(!this._fail) {
      this._fail = new FailParser(this)
    }
    return this._fail
  }

  // map :: (Parser s a, a -> b) -> Parser s b
  map(f) {
    return new MapParser(this, f)
  }

  // mapTo :: (Parser s a, b) -> Parser s b
  mapTo(v) {
    return this.map(() => v)
  }

  // apply :: (Parser s [a], (...a) -> b) -> Parser s b
  apply(fn) {
    if(this instanceof ApplyParser && this.fn != null) {
      return new ApplyParser(this.steps, fn)
    }
    return new MapParser(this, rs => fn(...rs))
  }

  // guard :: (Parser s a, a -> Boolean) -> Parser s a
  guard(fn) {
    return new GuardParser(this, fn)
  }

  // chain :: (Parser s a, a -> Parser s b) -> Parser s b
  chain(fn) {
    return new ChainParser(this, fn)
  }

  // orElse :: (Parser s a, Parser s a) -> Parser s a
  orElse(p2) {
    p2 = lift0(p2)
    const choices = [].concat(
      this.choices != null ? this.choices : this,
      p2.choices != null ? p2.choices : p2,
    )
    return new ChooseParser(choices)  
  }

  // repeat :: (Parser s a, Number, Number) -> Parser s [a]
  repeat(min, max) {
    return new RepeatParser(this, min, max)
  }

  // repeat :: (Parser s a, Parser s b, Number, Number) -> Parser s [a]
  sepBy(sep, min = 0, max) {
    sep = lift0(sep)
    const suffixes = many(secondP(sep, this), min, max)
    return apply(
      (x, xs) => [x, ...xs], 
      [this, suffixes]
    )
  }

  // between :: (Parser s a, Parser s b, Parser s c) -> Parser s a
  between(left, right) {
    left = lift0(left)
    right = lift0(right)
    return left.chain(_ => this.chain(x => right.mapTo(x)))
  }

  _checkNext(p, shouldMatch) {
    return this.chain(x => {
      return lift0(p).lookAhead().chain(b => b === shouldMatch ? pure(x) : this.fail) 
    })
  }

  // followedBy :: (Parser s a, Parser s b) -> Parser s a
  followedBy(p) {
    return firstP(this, p)
  }

  // notFollowedBy :: (Parser s a, Parser s b) -> Parser s a
  notFollowedBy(p) {
    return this._checkNext(p, false)
  }

  // chainLeft :: (Parser s a, Parser s ((a,a) -> b)) -> Parser s b
  infixLeft(op) {
    const suffixes = many(seq(op, this))
    return apply(
      (x, fys) => fys.reduce((acc, [f, y]) => f(acc, y), x),
      [this, suffixes])
  }

  infixRight(op) {
    const suffixes = many(seq(op, this))
    return apply( fold, [this, suffixes])

    function fold(x, fys) {
      if(fys.length === 0) return x
      const [[f,y], ...fys1] = fys
      return f(x, fold(y, fys1))
    }
  }

  fork(...opts) {
    return apply(
      (v, fn) => fn(v),
      [this, oneOf(...opts)]
    )
  }

  andMaybe(p) {
    return this.fork(p, empty.mapTo(id))
  }

}
  
  
class EmptyParser extends Parser {
  run(s, start) {
    return Success(start, start, EMPTY_RESULT)
  }
}

class FailParser extends Parser {
  
  constructor(parser) {
    super()
    this.parser = parser
  }
  
  run(s, start) {
    return Failure(start, this.parser)
  }
}

// TextParser :: String -> Parser String String
class TextParser extends Parser {

  constructor(text) {
    super()
    this.text = text
  }

  run(source, start) {
    const text = this.text
    if(source.startsWith(text, start.offset)) {
      return Success(start, start.consume(text), text)
    }
    return Failure(start, this)
  }

  toString() {
    return this.text
  }
}

// RegExpParser :: RegExp -> Parser String String
class RegExpParser extends Parser {
  constructor(regExp, label) {
    super()
    this.regExp = regExp
    this._bregExp = new RegExp('^' + regExp.source, regExp.flags.indexOf('i') >= 0 ? 'i' : '')
    this.label = label != null ? label : this.regExp.toString()
  }

  run(source, start) {
    const match = this._bregExp.exec(source.slice(start.offset))
    if(match == null) {
      return Failure(start, this)
    }
    const matchedText = match[0]
    return Success(start, start.consume(matchedText), matchedText)
  }
}

// LookAheadParser :: Parser s a -> Parser s a
class LookAheadParser extends Parser {
  constructor(parser) {
    super()
    this.parser = parser
  }

  run(source, start) {
    const result = this.parser.run(source, start)
    return Success(start, start, !result.isFailure)
  }
}

// PureParser :: a -> Parser s a
class PureParser extends Parser {
  constructor(value) {
    super()
    this.value = value
  }

  run(source, start) {
    return Success(start, start, this.value)
  }
}

// MapParser :: (Parser s a, a -> b) -> Parser s b
class MapParser extends Parser {
  constructor(parser, fn) {
    super()
    this.parser = parser
    this.fn = fn
  }

  run(source, start) {
    const result = this.parser.run(source, start)
    if(result.isFailure) return result
    return Success(result.start, result.end, this.fn(result.data))
  }
}

// GuardParser :: (Parser s a, a -> Boolean) -> Parser s a
class GuardParser extends Parser {
  constructor(parser, fn) {
    super()
    this.parser = parser
    this.fn = fn
  }

  run(source, start) {
    const result = this.parser.run(source, start)
    if(result.isFailure) return result
    if(this.fn(result.data)) return result
    return Failure(start, this.parser)
  }
}

// ChainParser :: (Parser s a, a -> Parser s b) -> Parser s b
class ChainParser extends Parser {
  constructor(parser, fn) {
    super()
    this.parser = parser
    this.fn = fn
  }

  run(source, start) {
    const result = this.parser.run(source, start)
    if(result.isFailure) return result
    const parser2 = this.fn(result.data)
    const result2 = parser2.run(source, result.end)
    if(result2.isFailure) return result2
    return Success(start, result2.end, result2.data)
  }
}

// ChooseParser :: [Parser s a] -> Parser s a
class ChooseParser extends Parser {
  constructor(choices) {
    super()
    this.choices = choices
  }

  run(source, start) {
    for(var i = 0; i < this.choices.length; i++) {
      const parser = this.choices[i]
      const result = parser.run(source, start)
      if(!result.isFailure || result.start.offset > start.offset) return result
    }
    return Failure(start, this)
  }
}
  
// ApplyParser :: ([Parser s a], (...a) -> b) -> Parser s b
class ApplyParser extends Parser {
  constructor(steps, fn) {
    super()
    this.steps = steps
    this.fn = fn
  }

  run(source, start) {
    const fn = this.fn
    var currenPos = start
    var accData = []
    for(var i = 0; i < this.steps.length; i++) {
      const parser = this.steps[i]
      const result = parser.run(source, currenPos)
      if(result.isFailure) return result
      if(!isEmpty(result.data)) {
        accData.push(result.data)
      }
      currenPos = result.end
    }
    return Success(start, currenPos, fn != null ? fn(...accData) : accData)
  }
}

// RepeatParser :: (Parser s a, Number, Number) -> Parser s [a]
class RepeatParser extends Parser {
  constructor(parser, min = 0, max = Infinity) {
    super()
    this.parser = parser
    this.min = min
    this.max = max
  }

  run(source, start) {
    const {parser, min, max} = this
    var currenPos = start
    var accData = []
    for(var i = 0; i < max; i++) {
      const result = parser.run(source, currenPos)
      if(result.isFailure) {
        if(i < min || result.start.offset > currenPos.offset) return result
        else break
      }
      else {  
        accData.push(result.data)
        currenPos = result.end
      }
    }
    return Success(start, currenPos, accData)
  }
}

// YieldParser :: Generator (Parser s a) -> Parser s a
class YieldParser extends Parser {
  constructor(fn) {
    super()
    this.fn = fn
  }

  run(source, start) {
    const g = this.fn()
    var currenPos = start
    var {done, value} = g.next()
    while(!done) {
      const parser = lift0(value)
      const result = parser.run(source, currenPos)
      if(result.isFailure) return result
      currenPos = result.end
      ;({done, value} = g.next(result.data))
    }
    return Success(start, currenPos, value)

  }
}

// LazyParser :: (() -> Parser s a) -> Parser s a
class LazyParser extends Parser {
  constructor(getParser) {
    super()
    this.getParser = getParser
  }

  run(source, start) {
    return this.getParser().run(source, start)
  }
}


// lift0 :: Parser s a | String | RegExp | Generator (Parser s a) -> Parser s a
function lift0(v) {
  if(v instanceof Parser) return v
  if(isPrimitive(v)) return text(v)
  if(v instanceof RegExp) return regex(v)
  if(typeof v === 'function') return co(v)
  throw new Error('Unkown parser! ' + v)
}
  

export const text = t => new TextParser(t)
export const regex = re => new RegExpParser(re)
export const empty = new EmptyParser()
export const pure = value => new PureParser(value)
export const map  = (p, fn) => new MapParser(lift0(p), fn)
export const mapTo  = (p, v) => new MapParser(lift0(p), () => v)
export const chain = (p, fn) => new ChainParser(lift0(p), fn)
export const oneOf = (...ps) => new ChooseParser(ps.map(lift0))
export const seq = (...ps) => new ApplyParser(ps.map(lift0))
export const apply = (fn, ps) => new ApplyParser(ps.map(lift0), fn)
export const many = (p, min, max) => new RepeatParser(lift0(p),min, max)
export const co = f => new YieldParser(f)
export const guard = (p, fn) => new GuardParser(lift0(p), fn)
export const lazy = getParser => new LazyParser(getParser)
export const skip = (p = Parser.SKIP) => p.skip()
export const chainLeft = (p, op) => lift0(p).recLeft(op)

export const lift2 = fn => (p1, p2) => apply(fn, [p1, p2])
export const firstP = lift2(first)
export const secondP = lift2(second)

export const token = p => firstP(p, token.SKIP)
  
export const spaces = regex(/\s*/).skip()
token.SKIP = spaces
  
export const natural = token(regex(/\d+/)).map(x => +x)
export const identifier = reserved => token(regex(/[a-z]+/).guard(x => !reserved.includes(x) ))
