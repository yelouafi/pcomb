import Parser from "./Parser";

export default class LazyParser extends Parser {
  constructor(getParser) {
    super();
    this.getParser = getParser;
  }

  run(source, state) {
    if (this.parser == null) {
      this.parser = this.getParser();
    }
    return this.parser.run(source, state);
  }
}
