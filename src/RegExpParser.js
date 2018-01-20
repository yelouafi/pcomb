import Parser from "./Parser";

export default class RegExpParser extends Parser {
  constructor(regExp) {
    super();
    this.pattern = regExp instanceof RegExp ? regExp.source : String(regExp);
    this.flags = regExp instanceof RegExp ? regExp.flags : "";
    this.anchoredRegex = new RegExp(
      "^(?:" + this.pattern + ")",
      this.flags.indexOf("i") >= 0 ? "i" : ""
    );
  }

  run(source, state) {
    const match = this.anchoredRegex.exec(source.slice(state.position.offset));
    if (match == null) {
      return state.failure(this.pattern);
    }
    const matchedText = match[0];
    return state.success(state.position.consume(matchedText), matchedText);
  }
}
