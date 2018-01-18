import Parser from "./Parser";

export default class GuardParser extends Parser {
  constructor(parser, predicate) {
    super();
    this.parser = parser;
    this.predicate = predicate;
  }

  run(source, state) {
    const state2 = this.parser.run(source, state);
    if (state2.isFailure() || this.predicate(state2.getData())) return state2;
    return state.failure(this.predicate.toString());
  }
}
