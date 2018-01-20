import Parser from "./Parser";

export default class TryParser extends Parser {
  constructor(parser) {
    super();
    this.parser = parser;
  }

  run(source, state) {
    const state2 = this.parser.run(source, state);
    if (!state2.isFailure()) return state2;
    return state.failure(state2.expected);
  }
}
