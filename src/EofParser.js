import Parser from "./Parser";

export default class EofParser extends Parser {
  run(source, state) {
    if (source.length > state.position.offset) {
      return state.failure("EOF");
    }
    return state;
  }
}
