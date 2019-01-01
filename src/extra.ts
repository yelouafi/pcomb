import { Parser, apply, many, oneOf, pure, MapToParser } from "./base";

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

export function sepBy<A, B>(
  sep: Parser<B>,
  p: Parser<A>,
  min = 0,
  max = Infinity
) {
  const suffixes = many(second(sep, p), min, max);
  return oneOf(apply((x: A, xs: A[]) => [x, ...xs], p, suffixes), pure([]));
}

export function between<A, B, C>(
  left: Parser<A>,
  right: Parser<B>,
  p: Parser<C>
) {
  return apply<[A, C, B], C>(second as any, left, p, right);
}

export function collect<TS extends any[]>(...ps: MapToParser<TS>): Parser<TS> {
  return apply<TS, TS>((...xs) => xs, ...(ps as any));
}

export function infixLeft<A>(op: Parser<(x: A, y: A) => A>, p: Parser<A>) {
  const suffixes = many(collect(op, p));
  return apply(
    (x, fys) => fys.reduce((acc, [f, y]) => f(acc, y), x),
    p,
    suffixes
  );
}

export function infixRight<A>(op: Parser<(x: A, y: A) => A>, p: Parser<A>) {
  const suffixes = many(collect(op, p));
  return apply(foldLeft, p, suffixes);

  function foldLeft(x: A, fys: [(x: A, y: A) => A, A][]): A {
    if (fys.length === 0) return x;
    const [[f, y], ...fys1] = fys;
    return f(x, foldLeft(y, fys1));
  }
}

export function lexeme<A>(junk: Parser<A>) {
  return <B>(p: Parser<B>) => first(p, junk);
}
