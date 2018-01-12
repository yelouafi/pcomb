
/* global pcomb */

const {
    token, apply, many, pure, secondP
} = pcomb


const PolyTerm = (sign, coeff, degree) => ({ sign, coeff, degree })

const sign = token(/\+|\-/)
const number = token(/\d+(?:\.\d+)?(?:[eE][-+]?\d+)?/).map(x => +x)
const variable = token('x')
const power = token('^')


// Parser s [number, number]
const makeTerm = isFirst => apply(PolyTerm,
  [
    isFirst ? sign.orElse(pure('+')) : sign,
    // coefficient
    number,
    // degree (default to 0)
    secondP(variable, secondP(power, number).orElse(pure(1)))
      .orElse(pure(0))
  ]
)

const polynomial = apply(
  (term1, terms) => terms.reduce((ts, t) => ts.concat(t), [term1]),
  [makeTerm(true), many(makeTerm(false))]
)  