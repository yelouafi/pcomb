import Parser from "./Parser";

export default class MapParser extends Parser {
  constructor(parser, fn) {
    super();
    this.parser = parser;
    this.fn = fn;
  }

  run(source, state) {
    const state2 = this.parser.run(source, state);
    return state2.mapData(this.fn);
  }
}
