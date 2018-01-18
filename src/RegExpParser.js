import Parser from "./Parser";

export default class RegExpParser extends Parser {
  constructor(regExp) {
    super();
    this.regExp = regExp;
    this.anchoredRegex = new RegExp(
      "^(?:" + regExp.source + ")",
      regExp.flags.indexOf("i") >= 0 ? "i" : ""
    );
  }

  run(source, state) {
    const match = this.anchoredRegex.exec(source.slice(state.position.offset));
    if (match == null) {
      return state.failure(this.regExp.source);
    }
    const matchedText = match[0];
    return state.success(state.position.consume(matchedText), matchedText);
  }
}
