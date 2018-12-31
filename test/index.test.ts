import * as test from "tape";
import { success, parse, text } from "../src/index";

test("text", assert => {
  const hello = text("hello");
  assert.deepEqual(parse(hello, "hello"), success("hello"));

  assert.equal(parse(hello, "bonjour").type, "Error");
  assert.end();
});
