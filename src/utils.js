export function isPrimitive(v) {
  const type = typeof v;
  return type === "string" || type === "number" || type === "boolean";
}

export function isIterator(o) {
  return (
    o != null && typeof o.next === "function" && typeof o.throw === "function"
  );
}

export function mergeObjects(o1, o2) {
  return Object.assign({}, o1, o2);
}

export const id = x => x;

export const first = id;

export const second = (_, y) => y;

export function sliceCr(str, pos) {
  const crIdx = str.indexOf("\n", pos.offset);
  if (crIdx >= 0) {
    return str.slice(pos.offset, crIdx);
  }
  return str.slice(pos.offset);
}
