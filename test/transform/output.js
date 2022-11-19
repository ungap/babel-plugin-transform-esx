var _templateReference = {},
  _templateReference2 = {},
  _templateReference3 = {},
  _templateReference4 = {};
globalThis.ESXToken ||
  (globalThis.ESXToken = class ESXToken {
    static STATIC_TYPE = 1 << 0;
    static MIXED_TYPE = 1 << 1;
    static RUNTIME_TYPE = 1 << 2;
    static TEMPLATE_TYPE = 1 << 3;
    static ELEMENT_TYPE = 1 << 6;
    static FRAGMENT_TYPE = 1 << 7;
    static COMPONENT_TYPE = 1 << 8;
    static create = (type, value) => ({
      __proto__: ESXToken.prototype,
      type,
      value,
    });
    static property = (type, name, value) => ({
      __proto__: ESXToken.prototype,
      type,
      name,
      value,
    });
    static template = (id, value) => ({
      __proto__: ESXToken.prototype,
      type: ESXToken.TEMPLATE_TYPE,
      id,
      value,
    });
    static chevron = (type, value, properties, children) => ({
      __proto__: ESXToken.prototype,
      type,
      value,
      properties,
      children,
    });
    static fragment = (...children) =>
      ESXToken.chevron(ESXToken.FRAGMENT_TYPE, null, null, children);
    static element = (tag, properties, ...children) =>
      ESXToken.chevron(ESXToken.ELEMENT_TYPE, tag, properties, children);
    static component = (fn, properties, ...children) =>
      ESXToken.chevron(ESXToken.COMPONENT_TYPE, fn, properties, children);
  });
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
