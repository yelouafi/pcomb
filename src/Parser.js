// global Set
import { sliceCr } from "./utils";
import ParserState from "./ParserState";

export default class Parser {
  run() {
    throw new Error("Abstract method!");
  }

  parse(s) {
    const state = this.run(s, ParserState.start());
    if (state.isFailure()) {
      /* eslint-disable */
      const expected = new Set(state.expected);
      const isEof = state.position.offset === s.length;
      throw new Error(`Parse error at ${state.position}. 
        Unexpected : ${isEof ? "EOF" : sliceCr(s, state.position)}
        Expected : ${[...expected].join(" or ")}
      `);
    }
    return state.getData();
  }
}
