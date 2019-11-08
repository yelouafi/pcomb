import {
  Parser,
  text,
  regex,
  eof,
  SUCCESS,
  MISMATCH,
  pure,
  fail,
  apply,
  oneOf,
  many
} from "./index";

import { parse, parseError } from "../test/utils"

test("pure", () => {
  const p = pure(1);
  expect(parse(p, "")).toEqual(1);
});

test("fail", () => {
  const p = fail("error");
  expect(parse(p, "")).toEqual("error");
});

test("text", () => {
  const p = text("hello");

  expect(parse(p, "hello")).toEqual("hello");
  expect(parse(p, "bonjour")).toEqual(parseError(0, ["hello"]));
});

test("regex", () => {
  const p = regex(/\d+/, "natural");

  expect(parse(p, "12")).toEqual("12");
  expect(parse(p, "not a number")).toEqual(parseError(0, ["natural"]));
});

test("map", () => {
  const p = regex(/\d+/, "natural").map(x => +x);

  expect(parse(p, "12")).toEqual(12);
  expect(parse(p, "not a number")).toEqual(parseError(0, ["natural"]));
});

test("apply", () => {
  const natural = regex(/\d+/, "natural").map(x => +x);
  const plus = regex(/\s*\+\s*/, "+");
  const p = apply(
    (x: number, _: string, y: number) => x + y,
    natural,
    plus,
    natural
  );

  expect(parse(p, "12 + 20")).toEqual(32);
  expect(parse(p, "not a number")).toEqual(parseError(0, ["natural"]));
  expect(parse(p, "12 not a number")).toEqual(parseError("12".length, ["+"]));
  expect(parse(p, "12 + not a number")).toEqual(
    parseError("12 + ".length, ["natural"])
  );
  expect(parse(p, "12 + 3not a number")).toEqual(
    parseError("12 + 3".length, ["EOF"])
  );
});

test("chain", () => {
  const word = regex(/[a-z]+/, "tag");

  const p = word.chain(s => text(s.length.toString()).map(x => +x));

  expect(parse(p, "hello5")).toEqual("hello".length);
  expect(parse(p, "+hello10")).toEqual(parseError(0, ["tag"]));
  expect(parse(p, "hello10")).toEqual(parseError("hello".length, ["5"]));
});

test("oneOf", () => {
  const p = oneOf(text("+"), text("-"));

  expect(parse(p, "+")).toEqual("+");
  expect(parse(p, "-")).toEqual("-");
  expect(parse(p, "*")).toEqual(parseError(0, ["+", "-"]));
});

test("oneOf expected tokens", () => {
  const natural = regex(/\s*\d+\s*/, "natural").map(x => +x);
  const op = oneOf(text("+"), text("-"), pure("*"));

  const p = apply(
    (x: number, op: string, y: number) =>
      op === "+" ? x + y : op === "-" ? x - y : x * y,
    natural,
    op,
    natural
  );

  expect(parse(p, "12 / 20")).toEqual(
    parseError("12 ".length, ["+", "-", "natural"])
  );
});

test("many", () => {
  const natural = regex(/\d+\s*/, "natural").map(x => +x);
  const p = many(natural);

  expect(parse(p, "")).toEqual([]);
  expect(parse(p, "10 20 30 40")).toEqual([10, 20, 30, 40]);
  expect(parse(p, "10 x 30 40")).toEqual(
    parseError("10 ".length, ["natural", "EOF"])
  );
});
