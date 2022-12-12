var _templateReference = {},
  _templateReference2 = {},
  _templateReference3 = {},
  _templateReference4 = {};
import ESXToken from "@ungap/esxtoken";
const div = new ESXToken(
  _templateReference,
  3,
  ESXToken._,
  ESXToken._,
  "div",
  "div"
);
const div2 = new ESXToken(
  _templateReference2,
  3,
  [ESXToken.a(false, "a", "a"), ESXToken.a(true, "b", "b")],
  [new ESXToken(null, 3, ESXToken._, [ESXToken.b(6, "c")], "p", "p")],
  "div",
  "div"
);
function MyComponent(...args) {
  return new ESXToken(_templateReference3, 4, ESXToken._, [
    ESXToken.b(5, "A"),
    ESXToken.b(6, ","),
    ESXToken.b(5, "B"),
  ]);
}
const component = new ESXToken(
  _templateReference4,
  2,
  [ESXToken.a(false, "a", "a"), ESXToken.b(5, props)],
  ESXToken._,
  "MyComponent",
  MyComponent
);
