import Parser from "./Parser";

export default class FoldParser extends Parser {
  constructor(steps, fn, getSeed) {
    super();
    this.steps = steps;
    this.fn = fn;
    this.getSeed = getSeed;
  }

  run(source, state) {
    const fn = this.fn;
    var currentState = state;
    var accData = this.getSeed();
    for (var i = 0; i < this.steps.length; i++) {
      const parser = this.steps[i];
      const newState = parser.run(source, currentState);
      if (newState.isFailure()) return newState;
      accData = fn(accData, newState.getData());
      currentState = newState;
    }
    return currentState.mapData(() => accData);
  }
}
