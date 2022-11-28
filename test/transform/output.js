var _templateReference = {},
  _templateReference2 = {},
  _templateReference3 = {},
  _templateReference4 = {};
import ESXToken from "@ungap/esxtoken";
const div = ESXToken.e(_templateReference, "div", ESXToken._);
const div2 = ESXToken.e(
  _templateReference2,
  "div",
  [ESXToken.a(false, "a", "a"), ESXToken.a(true, "b", "b")],
  [ESXToken.e(null, "p", ESXToken._, [ESXToken.s("c")])]
);
function MyComponent(...args) {
  return ESXToken.f(_templateReference3, [
    ESXToken.i("A"),
    ESXToken.s(","),
    ESXToken.i("B"),
  ]);
}
const component = ESXToken.c(_templateReference4, MyComponent, [
  ESXToken.a(false, "a", "a"),
  ESXToken.i(props),
]);
