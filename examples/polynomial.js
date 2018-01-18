import { lexeme, combine, eof, many, pure, secondP } from "../src";

const token = lexeme(/\s*/);

const PolyTerm = (sign, coeff, degree) => ({ sign, coeff, degree });

const sign = token(/\+|-/);
const number = token(/\d+(?:\.\d+)?(?:[eE][-+]?\d+)?/).map(x => +x);
const variable = token("x");
const power = token("^");

// Parser s [number, number]
export const makeTerm = isFirst =>
  combine(
    [
      isFirst ? sign.orElse(pure("+")) : sign,
      // coefficient
      number.orElse(pure(1)),
      // degree (default to 0)
      secondP(variable, secondP(power, number).orElse(pure(1))).orElse(pure(0))
    ],
    PolyTerm
  );

export const polynomial = combine(
  [makeTerm(true), many(makeTerm(false))],
  (term1, terms) => terms.reduce((ts, t) => ts.concat(t), [term1])
).skip(eof);
