import Parser from "./Parser";

export default class SetStateParser extends Parser {
  constructor(setter) {
    super();
    this.setter = setter;
  }

  run(_, state) {
    return state.setState(this.setter);
  }
}
