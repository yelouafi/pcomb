export const SUCCESS = Symbol("Success");
export const MISMATCH = Symbol("Mismatch");
export const FAILURE = Symbol("Failure");

type UserState = object;

export interface ParserState {
  position: number;
  expectedTokens: string[];
  userState: UserState;
}

export type ParserResult<A> =
  | { type: typeof SUCCESS; value: A; state: ParserState }
  | { type: typeof MISMATCH; state: ParserState }
  | { type: typeof FAILURE; message: string; state: ParserState };

export interface ParserFun<A> {
  (input: string, state: ParserState): ParserResult<A>;
}

export function success<A>(result: A, state: ParserState): ParserResult<A> {
  return {
    type: SUCCESS,
    value: result,
    state
  };
}

export function mismatch<A>(state: ParserState): ParserResult<A> {
  return {
    type: MISMATCH,
    state
  };
}

export function failure<A>(
  message: string,
  state: ParserState
): ParserResult<A> {
  return {
    type: FAILURE,
    message,
    state
  };
}

export function advance(state: ParserState, length: number): ParserState {
  return length === 0
    ? state
    : {
        ...state,
        position: state.position + length,
        expectedTokens: []
      };
}

export function expect(
  state: ParserState,
  expected: string | string[],
  override: boolean
) {
  return {
    ...state,
    expectedTokens: [
      ...new Set((override ? [] : state.expectedTokens).concat(expected))
    ]
  };
}

export const initialState: ParserState = {
  position: 0,
  expectedTokens: [],
  userState: {}
};

export class Parser<A> {
  public _parse: ParserFun<A>;

  constructor(parse: ParserFun<A>) {
    this._parse = parse;
  }

  parse(input: string, userState = {}) {
    return this._parse(input, { ...initialState, userState });
  }

  label(expected: string): Parser<A> {
    return new Parser((input, state) => {
      const presult = this._parse(input, state);
      if (presult.type !== MISMATCH) return presult;
      return mismatch(expect(state, expected, false));
    });
  }

  map<B>(f: (x: A) => B): Parser<B> {
    return new Parser((input, state) => {
      const presult = this._parse(input, state);
      if (presult.type !== SUCCESS) return presult;
      return {
        ...presult,
        value: f(presult.value)
      };
    });
  }

  chain<B>(f: (x: A) => Parser<B>): Parser<B> {
    return new Parser<B>((input, state) => {
      const presult = this._parse(input, state);
      if (presult.type !== SUCCESS) return presult;
      const p2 = f(presult.value);
      return p2._parse(input, presult.state);
    });
  }

  mapTo<B>(b: B): Parser<B> {
    return this.map(_ => b);
  }

  sepBy<B>(sep: Parser<B>): Parser<A[]> {
    const suffixes = many(second(sep, this));
    return oneOf(
      apply((x: A, xs: A[]) => [x, ...xs], this, suffixes),
      pure([])
    );
  }

  between<B, C>(left: Parser<B>, right: Parser<C>): Parser<A> {
    return apply<[B, A, C], A>(_second as any, left, this, right);
  }

  infixLeft(op: Parser<(x: A, y: A) => A>): Parser<A> {
    const suffixes = many(collect(op, this));
    return apply(
      (x, fys) => fys.reduce((acc, [f, y]) => f(acc, y), x),
      this,
      suffixes
    );
  }

  infixRight(op: Parser<(x: A, y: A) => A>): Parser<A> {
    const suffixes = many(collect(op, this));
    return apply(foldLeft, this, suffixes);

    function foldLeft(x: A, fys: [(x: A, y: A) => A, A][]): A {
      if (fys.length === 0) return x;
      const [[f, y], ...fys1] = fys;
      return f(x, foldLeft(y, fys1));
    }
  }

  skip<B>(junk: Parser<B>): Parser<A> {
    return first(this, junk);
  }

  orElse(p: Parser<A>): Parser<A> {
    return oneOf(this, p);
  }
}

export type ParserMap<T> = { [K in keyof T]: Parser<T[K]> };

export function pure<A>(value: A): Parser<A> {
  return new Parser(function pureParser(input, state) {
    return success(value, state);
  });
}

export function fail(message: string): Parser<never> {
  return new Parser(function failParser(input, state) {
    return failure(message, state);
  });
}

export function text(expected: string): Parser<string> {
  return new Parser(function textParser(input, state) {
    if (input.startsWith(expected, state.position)) {
      return success(expected, advance(state, expected.length));
    } else {
      return mismatch(expect(state, expected, false));
    }
  });
}

export function regex(
  re: RegExp,
  expected?: string | string[]
): Parser<string> {
  const anchoredRegex = new RegExp("^(?:" + re.source + ")", "");
  const expectedTokens = expected != null ? expected : re.source;

  return new Parser(function regexParser(input, state) {
    const match = anchoredRegex.exec(input.slice(state.position));
    if (match == null) {
      return mismatch(expect(state, expectedTokens, false));
    }
    const matchedText = match[0];
    return success(matchedText, advance(state, matchedText.length));
  });
}

export const eof = new Parser<null>(function eof_(
  input: string,
  state: ParserState
) {
  if (input.length > state.position) {
    return mismatch(expect(state, "EOF", false));
  }
  return success(null, state);
});

export function apply<TS extends any[], R>(
  fn: (...args: TS) => R,
  ...ps: ParserMap<TS>
): Parser<R> {
  return new Parser(function applyParser(input, state) {
    let results: TS = [] as any;
    for (let p of ps) {
      const presult = p._parse(input, state);
      if (presult.type !== SUCCESS) return presult;
      results.push(presult.value);
      state = presult.state;
    }
    return success(fn(...results), state);
  });
}

export function oneOf<A>(...ps: Parser<A>[]): Parser<A> {
  return new Parser(function oneOfParser(input, state) {
    let expected = state.expectedTokens;
    let initState = expect(state, [], true);
    for (let p of ps) {
      let presult = p._parse(input, state);
      if (presult.state.position > state.position) {
        return presult;
      } else if (presult.type === SUCCESS) {
        return success(presult.value, expect(presult.state, expected, false));
      } else if (presult.type === FAILURE) {
        return failure(presult.message, expect(presult.state, expected, false));
      } else if (presult.type === MISMATCH) {
        expected = expected.concat(presult.state.expectedTokens);
      }
    }
    return mismatch(expect(state, expected, true));
  });
}

export function lazy<A>(getP: () => Parser<A>): Parser<A> {
  let p: null | Parser<A> = null;
  return new Parser<A>(function lazyParser(input, state) {
    if (p == null) p = getP();
    return p._parse(input, state);
  });
}

const EMPTYARRAY: any = [];

export function many<A>(p: Parser<A>): Parser<A[]> {
  const manyP: Parser<A[]> = p
    .chain(x => oneOf(manyP, pure(EMPTYARRAY)).map(xs => [x].concat(xs)))
    .orElse(pure([]));
  return manyP;
}

export function go<R>(genFunc: () => IterableIterator<Parser<any>>): Parser<R> {
  return new Parser(function genParser(input, state) {
    const iter = genFunc();
    var { done, value } = iter.next();
    while (!done) {
      const presult = value._parse(input, state);
      if (presult.type !== SUCCESS) return presult;
      state = presult.state;
      ({ done, value } = iter.next(presult.value));
    }
    return success(value as any, state);
  });
}

export function tryp<A>(p: Parser<A>): Parser<A> {
  return new Parser(function(input, state) {
    const presult = p._parse(input, state);
    if (presult.type === SUCCESS) return presult;
    else if (presult.type === MISMATCH) {
      return mismatch(expect(state, presult.state.expectedTokens, false));
    } else {
      return failure(presult.message, state);
    }
  });
}

export function collect<TS extends any[]>(...ps: ParserMap<TS>): Parser<TS> {
  return apply<TS, TS>((...xs) => xs, ...(ps as any));
}

export function seq<A, T>(p1: Parser<A>, p: Parser<T>): Parser<T>;
export function seq<A, B, T>(
  p1: Parser<A>,
  p2: Parser<B>,
  p: Parser<T>
): Parser<T>;
export function seq<A, B, C, T>(
  p1: Parser<A>,
  p2: Parser<B>,
  p3: Parser<C>,
  p: Parser<T>
): Parser<T>;
export function seq<A, B, C, D, T>(
  p1: Parser<A>,
  p2: Parser<B>,
  p3: Parser<C>,
  p4: Parser<D>,
  p: Parser<T>
): Parser<T>;
export function seq(...ps: Parser<any>[]) {
  return apply((...xs) => xs[xs.length - 1], ...(ps as any));
}

type Position = {
  line: number;
  column: number;
};

function getPosition(input: string, position: number): Position {
  let offset = 0;
  let line = 0;
  let column = position;
  while (offset < position) {
    const newLineIndex = input.indexOf("\n", offset);
    if (newLineIndex < 0 || newLineIndex >= position) break;
    line++;
    column = position - newLineIndex - 1;
    offset = newLineIndex + 1;
  }

  return { line: line + 1, column: column + 1 };
}

export const position = new Parser(function position_(
  input: string,
  state: ParserState
): ParserResult<Position> {
  const pos = getPosition(input, state.position);
  return success(pos, state);
});

function _first<A, B>(x: A, y: B) {
  return x;
}

function _second<A, B>(x: A, y: B) {
  return y;
}

export function first<A, B>(p: Parser<A>, junk: Parser<B>): Parser<A> {
  return apply<[A, B], A>(_first, p, junk);
}

export function second<A, B>(junk: Parser<A>, p: Parser<B>): Parser<B> {
  return apply<[A, B], B>(_second, junk, p);
}

type MaybeParser = string | RegExp | Parser<string>;

export function liftP(a: MaybeParser): Parser<string> {
  if (typeof a === "string") return text(a);
  if (a instanceof RegExp) return regex(a);
  return a;
}

export function lexeme(junk: MaybeParser) {
  const junkP = liftP(junk);
  return (p: MaybeParser) => first(liftP(p), junkP);
}

export const getState = new Parser(function getStateParser(input, state) {
  return success(state.userState, state);
});

export function setState(userState: object) {
  return new Parser(function setStateParser(input, state) {
    return success(null, { ...state, userState });
  });
}
