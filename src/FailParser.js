import Parser from "./Parser";

export default class FailParser extends Parser {
  constructor(expected) {
    super();
    this.expected = expected;
  }

  run(source, state) {
    return state.failure(this.expected);
  }
}
