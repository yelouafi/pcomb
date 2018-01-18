import Parser from "./Parser";

export default class YieldParser extends Parser {
  constructor(gen) {
    super();
    this.gen = gen;
  }

  run(source, state) {
    const iter = this.gen();
    var currentState = state;
    var { done, value } = iter.next();
    while (!done) {
      const newState = value.run(source, currentState);
      if (newState.isFailure()) return newState;
      currentState = newState;
      ({ done, value } = iter.next(newState.getData()));
    }
    return currentState;
  }
}
