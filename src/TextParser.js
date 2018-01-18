import Parser from "./Parser";

export default class TextParser extends Parser {
  constructor(text) {
    super();
    this.text = text;
  }

  run(source, state) {
    const text = this.text;
    if (source.startsWith(text, state.position.offset)) {
      return state.success(state.position.consume(text), text);
    }
    return state.failure(this.text);
  }
}
