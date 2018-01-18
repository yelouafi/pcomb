import Parser from "./Parser";

export default class PureParser extends Parser {
  constructor(value) {
    super();
    this.value = value;
  }

  run(source, state) {
    return state.success(state.position, this.value);
  }
}
