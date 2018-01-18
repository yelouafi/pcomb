import { first, second } from "./utils";
import Parser from "./Parser";
import ChooseParser from "./ChooseParser";
import MapParser from "./MapParser";
import ChainParser from "./ChainParser";
import PureParser from "./PureParser";
import FailParser from "./FailParser";
import TextParser from "./TextParser";
import RegExpParser from "./RegExpParser";
import FoldParser from "./FoldParser";
import RepeatParser from "./RepeatParser";
import LazyParser from "./LazyParser";
import GuardParser from "./GuardParser";
import YieldParser from "./YieldParser";
import EofParser from "./EofParser";
import LabelParser from "./LabelParser";

Object.assign(Parser.prototype, {
  orElse(p) {
    return new ChooseParser(
      p instanceof ChooseParser ? [this, ...p.choices] : [this, p]
    );
  },

  map(f) {
    return new MapParser(this, f);
  },

  mapTo(v) {
    return this.map(() => v);
  },

  applyTo(...ps) {
    return combine([this, ...ps], (fn, ...values) => fn.apply(null, values));
  },

  chain(fn) {
    return new ChainParser(this, fn);
  },

  skip(p) {
    return firstP(this, lift0(p));
  },

  sepBy(sep, min = 0, max) {
    const suffixes = many(secondP(lift0(sep), this), min, max);
    return oneOf(combine([this, suffixes], (x, xs) => [x, ...xs]), pure([]));
  },

  between(left, right) {
    return combine([lift0(left), this, lift0(right)], second);
  },

  guard(pred) {
    return new GuardParser(this, pred);
  },

  infixLeft(op) {
    const suffixes = many(collect(op, this));
    return combine([this, suffixes], (x, fys) =>
      fys.reduce((acc, [f, y]) => f(acc, y), x)
    );
  },

  infixRight(op) {
    const suffixes = many(collect(op, this));
    return combine([this, suffixes], foldLeft);

    function foldLeft(x, fys) {
      if (fys.length === 0) return x;
      const [[f, y], ...fys1] = fys;
      return f(x, foldLeft(y, fys1));
    }
  },

  label(lab) {
    return new LabelParser(this, lab, false, true);
  },

  debug(label) {
    return new LabelParser(this, label, true, false);
  }
});

export const pure = value => new PureParser(value);

export const fail = exp => new FailParser(exp);

export const eof = new EofParser();

export const text = txt => new TextParser(txt);

export const regex = re => new RegExpParser(re);

export const oneOf = (...ps) => new ChooseParser(ps);

export const fold = (ps, fn, getSeed) => new FoldParser(ps, fn, getSeed);

export const seq = (...ps) => new FoldParser(ps, second, () => null);

export const lazy = getP => new LazyParser(getP);

export const collect = (...ps) => {
  return fold(
    ps,
    function _safe_push_(acc, data) {
      acc.push(data);
      return acc;
    },
    () => []
  );
};

export const combine = (ps, fn, ctx = null) => {
  return collect(...ps).map(values => fn.apply(ctx, values));
};

export const many = (p, min, max) => new RepeatParser(p, min, max);

export const go = gen => new YieldParser(gen);

export const lift1 = fn => p => p.map(fn);
export const lift = fn => (...ps) => combine(ps, fn);

export const firstP = lift(first);
export const secondP = lift(second);
export const nullP = pure(null);

function lift0(v) {
  if (v instanceof Parser) return v;
  if (typeof v === "string") return text(v);
  if (v instanceof RegExp) return regex(v);
  if (typeof v === "function") return go(v);
  throw new Error("Unkown parser! " + v);
}

export const lexeme = junk => {
  const junkP = lift0(junk);
  return p => lift0(p).skip(junkP);
};
