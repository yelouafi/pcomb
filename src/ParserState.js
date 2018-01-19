import Position from "./Position";
import { id, mergeObjects } from "./utils";

export default class ParserState {
  constructor(position, userState, result, expected = []) {
    this.position = position;
    this.userState = userState;
    this.result = result;
    this.expected = expected;
  }

  static start(userState = {}) {
    return new ParserState(Position.ZERO, userState, {
      start: Position.ZERO,
      end: Position.ZERO
    });
  }

  success(end, data, expected = []) {
    return new ParserState(
      end,
      this.userState,
      {
        start: this.position,
        end,
        data
      },
      this.mergeExpected(expected, end)
    );
  }

  failure(expected) {
    return new ParserState(
      this.position,
      this.userState,
      {
        isFailure: true,
        start: this.position
      },
      this.expected.concat(expected)
    );
  }

  isFailure() {
    return this.result != null && this.result.isFailure;
  }

  getData() {
    return this.result.data;
  }

  mapData(fn) {
    if (this.isFailure()) return this;
    return new ParserState(
      this.position,
      this.userState,
      Object.assign({}, this.result, { data: fn(this.getData()) }),
      this.expected
    );
  }

  setState(setter) {
    const newState =
      typeof setter === "function"
        ? setter(this.userState)
        : mergeObjects(this.userState, setter);
    return new ParserState(
      this.position,
      newState,
      this.userState,
      this.expected
    );
  }

  getState(selector = id) {
    return this.mapData(() => selector(this.userState));
  }

  hasAdvanced(prevState) {
    return this.position.offset > prevState.position.offset;
  }

  mergeExpected(newExpected, newPos) {
    if (this.position.offset === newPos.offset) {
      return this.expected.concat(newExpected);
    }
    return newExpected;
  }

  return(data) {
    return this.success(this.position, data);
  }
}
