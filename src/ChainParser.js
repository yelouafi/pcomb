import Parser from "./Parser";

export default class ChainParser extends Parser {
  constructor(parser, fn) {
    super();
    this.parser = parser;
    this.fn = fn;
  }

  run(source, state) {
    const state2 = this.parser.run(source, state);
    if (state2.isFailure()) return state2;
    const parser2 = this.fn(state2.getData());
    return parser2.run(source, state2);
  }
}
