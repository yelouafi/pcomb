export const SUCCESS = Symbol("Success");
export const MISMATCH = Symbol("Mismatch");
export const FAILURE = Symbol("Failure");

export interface ParserState {
  position: number;
  expectedTokens: string[];
}

export type ParserResult<A> =
  | { type: typeof SUCCESS; value: A; state: ParserState }
  | { type: typeof MISMATCH; state: ParserState }
  | { type: typeof FAILURE; message: string; state: ParserState };

export interface Parser<A> {
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
    expected: (override ? [] : state.expectedTokens).concat(expected)
  };
}

export function pure<A>(value: A): Parser<A> {
  return function pureParser(input, state) {
    return success(value, state);
  };
}

export function fail(message: string): Parser<never> {
  return function failParser(input, state) {
    return failure(message, state);
  };
}

export function text(expected: string): Parser<string> {
  return function textParser(input, state) {
    if (input.startsWith(expected, state.position)) {
      return success(expected, advance(state, expected.length));
    } else {
      return mismatch(expect(state, expected, false));
    }
  };
}

export function regex(
  re: RegExp,
  expected?: string | string[]
): Parser<string> {
  const anchoredRegex = new RegExp("^(?:" + re.source + ")", "");
  const expectedTokens = expected != null ? expected : re.source;

  return function regexParser(input, state) {
    const match = anchoredRegex.exec(input.slice(state.position));
    if (match == null) {
      return mismatch(expect(state, expectedTokens, false));
    }
    const matchedText = match[0];
    return success(matchedText, advance(state, matchedText.length));
  };
}

function _eof(input: string, state: ParserState): ParserResult<null> {
  if (input.length > state.position) {
    return mismatch(expect(state, "eof!", false));
  }
  return success(null, state);
}

export const eof: Parser<null> = _eof;

export function map<A, B>(f: (x: A) => B, p: Parser<A>): Parser<B> {
  return function mapParser(input, state) {
    const presult = p(input, state);
    if (presult.type !== SUCCESS) return presult;
    return {
      ...presult,
      value: f(presult.value)
    };
  };
}

export type MapToParser<T> = { [K in keyof T]: Parser<T[K]> };

export function apply<TS extends any[], R>(
  fn: (...args: TS) => R,
  ...ps: MapToParser<TS>
): Parser<R> {
  return function applyParser(input, state) {
    let results: TS = [] as any;
    for (let p of ps) {
      const presult = p(input, state);
      if (presult.type !== SUCCESS) return presult;
      results.push(presult.value);
      state = presult.state;
    }
    return success(fn(...results), state);
  };
}

export function oneOf<A>(...ps: Parser<A>[]): Parser<A> {
  return function oneOfParser(input, state) {
    let expected = state.expectedTokens;
    let initState = expect(state, [], true);
    for (let p of ps) {
      let presult = p(input, state);
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
  };
}

export function lazy<A>(getP: () => Parser<A>): Parser<A> {
  let p: null | Parser<A> = null;
  return function lazyParser(input, state) {
    if (p == null) p = getP();
    return p(input, state);
  };
}

export function chain<A, B>(f: (x: A) => Parser<B>, p: Parser<A>): Parser<B> {
  return function chainParser(input, state) {
    const presult = p(input, state);
    if (presult.type !== SUCCESS) return presult;
    const p2 = this.fn(presult.value);
    return p2(input, presult.state);
  };
}

export function label<A>(p: Parser<A>, expected: string | string[]): Parser<A> {
  return function labelParser(input, state) {
    const presult = p(input, state);
    if (presult.type !== MISMATCH) return presult;
    return mismatch(expect(state, expected, false));
  };
}

export function many<A>(p: Parser<A>, min = 0, max = Infinity): Parser<A[]> {
  return function manyParser(input, state) {
    let results: A[] = [];
    for (let i = 0; i < max; i++) {
      const pres = p(input, state);
      if (pres.type !== SUCCESS) {
        if (pres.state.position > state.position || i < min) {
          return pres;
        }
      } else {
        results.push(pres.value);
      }
      state = pres.state;
    }
    return success(results, state);
  };
}

export function go<R>(genFunc: () => IterableIterator<Parser<any>>): Parser<R> {
  return function(input, state) {
    const iter = genFunc();
    var { done, value } = iter.next();
    while (!done) {
      const presult = value(input, state);
      if (presult.type !== SUCCESS) return presult;
      state = presult.state;
      ({ done, value } = iter.next(presult.value));
    }
    return success(value as any, state);
  };
}

export function tryp<A>(p: Parser<A>): Parser<A> {
  return function(input, state) {
    const presult = p(input, state);
    if (presult.type === SUCCESS) return presult;
    else if (presult.type === MISMATCH) {
      return mismatch(expect(state, presult.state.expectedTokens, false));
    } else {
      return failure(presult.message, state);
    }
  };
}
