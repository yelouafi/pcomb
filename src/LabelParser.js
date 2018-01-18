import Parser from "./Parser";

export default class LabelParser extends Parser {
  constructor(parser, label, isDebug, isFail) {
    super();
    this.parser = parser;
    this.label = label;
    this.isDebug = isDebug;
    this.isFail = isFail;
  }

  run(source, state) {
    if (this.isDebug) {
      /* eslint-disable */
      console.group(
        this.label + " on '" + source.slice(state.position.offset) + "'"
      );
    }
    const state2 = this.parser.run(source, state);
    if (this.isDebug) {
      /* eslint-disable */
      console.groupEnd();
      return state2;
    } else if (this.isFail) {
      if (!state2.isFailure() || state2.hasAdvanced(state)) return state2;
      return state.failure(this.label);
    }
  }
}
