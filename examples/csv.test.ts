import { csv } from "./csv";
import { parse } from "../test/utils";

test("csv", () => {
  expect(
    parse(
      csv,
      "Year,Make,Model,Description,Price\n" +
        '1997,Ford,E350,"ac, abs, moon",3000.00'
    )
  ).toEqual([
    ["Year", "Make", "Model", "Description", "Price"],
    ["1997", "Ford", "E350", "ac, abs, moon", "3000.00"]
  ]);
});
