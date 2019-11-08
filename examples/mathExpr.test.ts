
import { mathExpr } from "./mathExpr";
import { parse } from "../test/utils"

test("mathExpr", () => {
  expect(
    parse(
      mathExpr,
      "1 + 2 * 3 - (4 / 2)"
    )
  ).toEqual(1 + 2 * 3 - (4 / 2));
});
