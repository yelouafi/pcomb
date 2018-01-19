import Parser from "./Parser";

export default class GuardParser extends Parser {
  constructor(parser, predicate, expected) {
    super();
    this.parser = parser;
    this.predicate = predicate;
    this.expected = expected;
  }

  run(source, state) {
    const state2 = this.parser.run(source, state);
    if (
      state2.isFailure() ||
      this.predicate(state2.getData(), state2.userState)
    )
      return state2;
    return state.failure(this.expected || "predicate is true");
  }
}
