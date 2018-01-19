import Parser from "./Parser";

export default class GetStateParser extends Parser {
  constructor(selector) {
    super();
    this.selector = selector;
  }

  run(_, state) {
    return state.getState(this.selector);
  }
}
