var _templateReference = {},
  _templateReference2 = {},
  _templateReference3 = {},
  _templateReference4 = {};
import ESXToken from "@ungap/esxtoken";
const div = ESXToken.template(
  _templateReference,
  ESXToken.element("div", null)
);
const div2 = ESXToken.template(
  _templateReference2,
  ESXToken.element(
    "div",
    ESXToken.create(ESXToken.MIXED_TYPE, [
      ESXToken.property(ESXToken.STATIC_TYPE, "a", "a"),
      ESXToken.property(ESXToken.RUNTIME_TYPE, "b", "b"),
    ]),
    ESXToken.create(
      ESXToken.STATIC_TYPE,
      ESXToken.element("p", null, ESXToken.create(ESXToken.STATIC_TYPE, "c"))
    )
  )
);
function MyComponent(...args) {
  return ESXToken.template(
    _templateReference3,
    ESXToken.fragment(
      ESXToken.create(ESXToken.RUNTIME_TYPE, "A"),
      ESXToken.create(ESXToken.STATIC_TYPE, ","),
      ESXToken.create(ESXToken.RUNTIME_TYPE, "B")
    )
  );
}
const component = ESXToken.template(
  _templateReference4,
  ESXToken.component(
    MyComponent,
    ESXToken.create(ESXToken.RUNTIME_TYPE, [
      ESXToken.property(ESXToken.STATIC_TYPE, "a", "a"),
      ESXToken.property(ESXToken.RUNTIME_TYPE, "", props),
    ])
  )
);
