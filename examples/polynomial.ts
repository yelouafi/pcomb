import { lexeme, apply, eof, many, pure, second } from "../src";

export type PolyTerm = {
  sign: string;
  coeff: number;
  degree: number;
};

export type Polynomial = Array<PolyTerm>;

const token = lexeme(/\s*/);

export function makePolyTerm(
  sign: string,
  coeff: number,
  degree: number
): PolyTerm {
  return {
    sign,
    coeff,
    degree
  };
}

const sign = token(/\+|-/);
const number = token(/\d+(?:\.\d+)?(?:[eE][-+]?\d+)?/).map(x => +x);
const variable = token("x");
const power = token("^");

export function makeTerm(isFirst: boolean) {
  return apply(
    makePolyTerm,

    isFirst ? sign.orElse(pure("+")) : sign,
    // coefficient
    number.orElse(pure(1)),
    // degree (default to 0)
    second(variable, second(power, number).orElse(pure(1))).orElse(pure(0))
  );
}

export const polynomial = apply(
  (term1, terms) => terms.reduce((ts, t) => ts.concat(t), [term1]),
  makeTerm(true),
  many(makeTerm(false))
).skip(eof);
