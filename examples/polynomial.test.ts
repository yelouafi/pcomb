import { polynomial, makePolyTerm } from "./polynomial";
import { parse } from "../test/utils";

test("polynomial", () => {
  expect(parse(polynomial, "2x^3 - x^2 + 3x - 22")).toEqual([
    makePolyTerm("+", 2, 3),
    makePolyTerm("-", 1, 2),
    makePolyTerm("+", 3, 1),
    makePolyTerm("-", 22, 0)
  ]);
});
