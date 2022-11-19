export class ESXToken {
  // property/ies + interpolations + templates
  static STATIC_TYPE      = 1 << 0; // 1
  static MIXED_TYPE       = 1 << 1; // 2
  static RUNTIME_TYPE     = 1 << 2; // 4
  static TEMPLATE_TYPE    = 1 << 3; // 8

  // angle-brackets kind
  static ELEMENT_TYPE     = 1 << 6; // 64
  static FRAGMENT_TYPE    = 1 << 7; // 128
  static COMPONENT_TYPE   = 1 << 8; // 256

  // the following utilities DO NOT NEED TO BE AVAILABLE or standardized
  // these are here to simplify, via a namespace, a possible Babel transformer

  // child / properties
  static create = (type, value) => ({__proto__: ESXToken.prototype, type, value});

  // specialized cases
  static property = (type, name, value) => ({__proto__: ESXToken.prototype, type, name, value});
  static template = (id, value) => ({__proto__: ESXToken.prototype, type: ESXToken.TEMPLATE_TYPE, id, value});
  static chevron = (type, value, properties, children) => ({__proto__: ESXToken.prototype, type, value, properties, children});
  static fragment = (...children) => ESXToken.chevron(ESXToken.FRAGMENT_TYPE, null, null, children);
  static element = (tag, properties, ...children) => ESXToken.chevron(ESXToken.ELEMENT_TYPE, tag, properties, children);
  static component = (fn, properties, ...children) => ESXToken.chevron(ESXToken.COMPONENT_TYPE, fn, properties, children);
}
