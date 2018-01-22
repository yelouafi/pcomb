import {
  language,
  text,
  regex,
  lexeme,
  oneOf,
  many,
  seq,
  maybe,
  secondP,
  combine,
  collect,
  eof
} from "../src";

function RE(strings, ...args) {
  return String.raw(
    strings,
    ...args.map(v => {
      return "(?:" + (v instanceof RegExp ? v.source : String(v)) + ")";
    })
  );
}

const token = lexeme(/\s*/);

const nl = /\n|\r\n|\r|\f/;
const nonascii = /[^\u0000-\u0177]/;
const unicode = /\\[0-9a-f]{1,6}(\r\n|[ \n\r\t\f])?/;
const escape = RE`${unicode}|${/\\[^\n\\r\f0-9a-f]/}`;
const num = /[0-9]+|[0-9]*\.[0-9]+/;
const nmstart = RE`[_a-z]|${nonascii}|${escape}`;
const nmchar = RE`[_a-z0-9-]|${nonascii}|${escape}`;
const ident = RE`[-]?${nmstart}${nmchar}*`;
const string1 = RE`"(?:${/[^\n\r\f\\"]/}|${/\\/}${nl}|${nonascii}|${escape})*"`;
const string2 = RE`'(?:${/[^\n\r\f\\']/}|${/\\/}${nl}|${nonascii}|${escape})*'`;
const string = RE`${string1}|${string2}`;
const name = RE`${nmchar}+`;
const hash = RE`#${name}`;

console.log(new RegExp(ident));

export const { css } = language({
  COMMA: text(","),
  SPACES: regex(/\s*/),
  SPACES_1: regex(/\s+/),
  PLUS: regex(/\s*\+/).mapTo("+"),
  GREATER: regex(/\s*>/).mapTo(">"),
  TILDE: regex(/\s*~/).mapTo("~"),
  NAME: regex(name),
  HASH: regex(hash),
  IDENT: regex(ident),
  STRING: regex(string),
  NUMBER: regex(num).map(x => +x),
  NOT: regex(/\:not\(\s*/),
  PREFIXMATCH: text("^="),
  SUFFIXMATCH: text("$="),
  SUBSTRINGMATCH: text("*="),
  EQUAL: text("="),
  INCLUDES: text("~="),
  DASHMATCH: text("|="),
  FUNCTION: regex(/[a-z]+\(/),

  class: r => seq(text("."), r.IDENT).node("class"),
  hash: r => r.HASH.node("hash"),

  css(r) {
    return r.selectors_group.skip(eof);
  },

  selectors_group(r) {
    return r.selector.sepBy(seq(r.COMMA, r.SPACES)).node("selector_group");
  },

  selector(r) {
    return r.simple_selector_sequence
      .infixLeft(
        r.combinator.map(comb => (acc, sel) =>
          comb === null ? [...acc, sel] : [...acc, comb, sel]
        )
      )
      .node("simple_selector_sequence");
  },

  combinator(r) {
    return oneOf(
      token(r.PLUS),
      token(r.GREATER),
      token(r.TILDE),
      r.SPACES_1.mapTo(null)
    );
  },

  simple_selector_sequence(r) {
    return oneOf(
      collect(
        oneOf(r.type_selector, r.universal),
        many(oneOf(r.hash, r.class, r.attrib, r.negation, r.pseudo))
      ).map(([pre, suffs]) => [pre, ...suffs]),
      many(oneOf(r.hash, r.class, r.attrib, r.negation, r.pseudo), 1)
    );
  },

  type_selector(r) {
    return combine([maybe(r.namespace_prefix), r.IDENT], (namespace, name) => ({
      type: "type_selector",
      namespace,
      name
    }));
  },

  universal(r) {
    return combine([maybe(r.namespace_prefix), text("*")], (namespace, _) => ({
      type: "universal",
      namespace
    }));
  },

  namespace_prefix(r) {
    return maybe(oneOf(r.IDENT, text("*"))).skip(text("|"));
  },

  *attrib(r) {
    const node = { type: "attribute" };

    yield text("[");
    node.name = yield r.IDENT.skip(r.SPACES);

    node.op = yield maybe(
      oneOf(
        r.PREFIXMATCH,
        r.SUFFIXMATCH,
        r.SUBSTRINGMATCH,
        r.INCLUDES,
        r.DASHMATCH,
        r.EQUAL
      )
    ).skip(r.SPACES);

    if (node.op != null) {
      node.value = yield oneOf(r.IDENT, r.STRING).skip(r.SPACES);
    }

    yield text("]");
    return node;
  },

  pseudo(r) {
    const suffix = oneOf(r.functional_pseudo, r.IDENT);
    return oneOf(
      secondP(text("::"), suffix).node("pseudo-element"),
      secondP(text(":"), suffix).node("pseudo-class")
    );
  },

  functional_pseudo(r) {
    return collect(
      r.FUNCTION.map(s => s.substring(0, s.length - 1)).skip(r.SPACES),
      r.expression.skip(seq(r.SPACES, text(")")))
    ).node("functional_pseudo");
  },

  expression(r) {
    //[ [ PLUS | '-' | DIMENSION | NUMBER | STRING | IDENT ] S* ]+
    return many(
      oneOf(r.PLUS, text("-"), r.STRING, r.IDENT, r.NUMBER).skip(r.SPACES),
      1
    ).node("expression");
  },

  negation(r) {
    return r.negation_argument
      .between(r.NOT, seq(r.SPACES, text(")")))
      .node("negation");
  },

  negation_argument(r) {
    return oneOf(
      r.type_selector,
      r.universal,
      r.hash,
      r.class,
      r.attrib,
      r.pseudo
    );
  }
});
