import Parser from "./Parser";

export default class RepeatParser extends Parser {
  constructor(parser, min = 0, max = Infinity) {
    super();
    this.parser = parser;
    this.min = min;
    this.max = max;
  }

  run(source, state) {
    const { parser, min, max } = this;
    var currentState = state;
    var accData = [];
    for (var i = 0; i < max; i++) {
      const newState = parser.run(source, currentState);
      if (newState.isFailure()) {
        if (i < min || newState.hasAdvanced(currentState)) return newState;
        else {
          return currentState.success(
            currentState.position,
            accData,
            newState.expected
          );
        }
      } else {
        accData.push(newState.getData());
        currentState = newState;
      }
    }
    //console.log("repeat", accData, currenPos.offset);
  }
}
