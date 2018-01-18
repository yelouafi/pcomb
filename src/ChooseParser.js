import Parser from "./Parser";

export default class ChooseParser extends Parser {
  constructor(choices) {
    super();
    this.choices = choices;
  }

  run(source, state) {
    let expected = [];
    for (var i = 0; i < this.choices.length; i++) {
      const parser = this.choices[i];
      const state2 = parser.run(source, state);
      if (state2.hasAdvanced(state)) return state2;
      if (state2.isFailure()) {
        expected = expected.concat(state2.expected);
      } else {
        return state.success(state.position, state2.getData(), expected);
      }
    }
    return state.failure(expected);
  }
}
