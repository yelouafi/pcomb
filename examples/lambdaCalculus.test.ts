import { lambdaExp, Var, App, Fun } from "./lambdaCalculus";
import { parse } from "../test/utils";

test("lambdaCalculus", () => {
  const source = "\\g.(\\x.(g (x x))) (\\x.(g (x x)))";
  const x = Var("x");
  const g = Var("g");
  const gexp = Fun("x", App(g, App(x, x)));
  expect(parse(lambdaExp, source)).toEqual(Fun("g", App(gexp, gexp)));
});
