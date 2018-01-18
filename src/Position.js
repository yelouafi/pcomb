export default class Position {
  constructor(line, column, offset) {
    this.line = line;
    this.column = column;
    this.offset = offset;
  }

  consume(text) {
    const length = text.length;
    if (length === 0) return this;

    const { line, column, offset } = this;
    if (text.indexOf("\n") < 0) {
      return new Position(line, column + length, offset + length);
    }

    const lines = text.split("\n");
    const breaks = lines.length - 1;
    const lastWidth = lines[breaks].length;
    return new Position(
      line + breaks,
      breaks > 0 ? lastWidth + 1 : column + lastWidth,
      offset + length
    );
  }

  toString() {
    return `Line ${this.line}, Column: ${this.column}`;
  }
}

Position.ZERO = new Position(1, 1, 0);
