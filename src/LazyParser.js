import Parser from "./Parser";

export default class LazyParser extends Parser {
  constructor(getParser) {
    super();
    this.getParser = getParser;
  }

  run(source, state) {
    return this.getParser().run(source, state);
  }
}
