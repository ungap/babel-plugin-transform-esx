import syntaxJSX from "@babel/plugin-syntax-jsx";
import { getInlinePolyfill, getExternalPolyfill } from "./polyfill.js";

/**
 * @param {import("@babel/core")} babelApi
 */
export default function ({ template, types: t }, { polyfill = "inline" }) {
  if (polyfill !== false && polyfill !== "inline" && polyfill !== "import") {
    throw new Error(
      `The .polyfill option must be one of: false, "inline", "import".`
    );
  }

  /** @type {import("@babel/core").Visitor} */
  const visitor = {
    JSXElement(path) {
      path.replaceWith(buildTemplate(path.scope, transformElement(path)));
    },
    JSXFragment(path) {
      path.replaceWith(buildTemplate(path.scope, transformFragment(path)));
    },
  };

  const polyfillInjected = new WeakSet();

  function ensurePolyfill(programPath) {
    if (!polyfill || polyfillInjected.has(programPath.node)) return;
    polyfillInjected.add(programPath.node);

    programPath.unshiftContainer(
      "body",
      polyfill === "inline"
        ? getInlinePolyfill(template)
        : getExternalPolyfill(template)
    );
  }

  /**
   * @param {import("@babel/traverse").Scope} scope
   * @param {import("@babel/types").Expression} scope
   */
  function buildTemplate(scope, content) {
    const ref = scope.generateUidIdentifier("templateReference");
    const programScope = scope.getProgramParent();
    programScope.push({ id: t.cloneNode(ref), init: t.objectExpression([]) });

    ensurePolyfill(programScope.path);

    return template.expression.ast`ESXToken.template(${ref}, ${content})`;
  }

  function transformElement(path) {
    /** @type {import("@babel/types").JSXElement} */
    const node = path.node;
    const jsxElementName = node.openingElement.name;

    let factory;
    let element;
    if (
      t.isJSXNamespacedName(jsxElementName) ||
      (t.isJSXIdentifier(jsxElementName) && /^[a-z]/.test(jsxElementName.name))
    ) {
      factory = "element";
      element = jsxToString(jsxElementName);
    } else {
      factory = "component";
      element = jsxToJS(jsxElementName);
    }

    return t.callExpression(
      t.memberExpression(t.identifier("ESXToken"), t.identifier(factory)),
      [
        element,
        transformAttributesList(path.get("openingElement")),
        ...path.get("children").map(transformChild).filter(Boolean),
      ]
    );
  }

  function transformFragment(path) {
    return t.callExpression(
      t.memberExpression(t.identifier("ESXToken"), t.identifier("fragment")),
      path.get("children").map(transformChild).filter(Boolean)
    );
  }

  /**
   * @param {import("@babel/types").JSXIdentifier | import("@babel/types").JSXMemberExpression} node
   * @returns {import("@babel/types").Identifier | import("@babel/types").MemberExpression}
   */
  function jsxToJS(node) {
    if (t.isJSXMemberExpression(node)) {
      return t.inherits(
        t.memberExpression(jsxToJS(node.object), jsxToJS(node.property)),
        node
      );
    }
    return t.inherits(t.identifier(node.name), node);
  }

  /**
   * @param {import("@babel/types").JSXIdentifier | import("@babel/types").JSXNamespacedName} node
   * @returns {import("@babel/types").StringLiteral}
   */
  function jsxToString(node) {
    let str = t.isJSXNamespacedName(node)
      ? `${node.namespace.name}:${node.name.name}`
      : node.name;
    return t.inherits(t.stringLiteral(str), node);
  }

  function transformAttributesList(path) {
    /** @type {import("@babel/types").JSXOpeningElement} */
    const node = path.node;

    if (node.attributes.length === 0) return t.nullLiteral();

    let type = "STATIC_TYPE";
    for (const attr of node.attributes) {
      if (t.isJSXSpreadAttribute(attr)) {
        type = "RUNTIME_TYPE";
        break;
      } else if (
        t.isJSXAttribute(attr) &&
        t.isJSXExpressionContainer(attr.value)
      ) {
        type = "MIXED_TYPE";
      }
    }

    return template.expression.ast`
      ESXToken.create(
        ESXToken.${t.identifier(type)},
        ${t.arrayExpression(path.get("attributes").map(transformAttribute))}
      )
    `;
  }

  function transformAttribute(path) {
    /** @type {import("@babel/types").JSXAttribute | import("@babel/types").JSXSpreadAttribute} */
    const node = path.node;

    let type, name, value;
    if (t.isJSXSpreadAttribute(node)) {
      type = "RUNTIME_TYPE";
      name = t.stringLiteral("");
      value = node.argument;
    } else if (t.isJSXExpressionContainer(node.value)) {
      type = "RUNTIME_TYPE";
      name = jsxToString(node.name);
      value = node.value.expression;
    } else if (t.isJSXElement(node.value) || t.isJSXFragment(node.value)) {
      throw path
        .get("value")
        .buildCodeFrameError(
          "JSX elements are not supported as static attributes. Please wrap it in { }."
        );
    } else if (node.value) {
      type = "STATIC_TYPE";
      name = jsxToString(node.name);
      value = node.value;
    } else {
      type = "STATIC_TYPE";
      name = jsxToString(node.name);
      value = t.booleanLiteral(true);
    }

    return t.inherits(
      template.expression.ast`
        ESXToken.property(ESXToken.${t.identifier(type)}, ${name}, ${value})
      `,
      node
    );
  }

  function transformChild(path) {
    /** @type {import("@babel/types").JSXElement["children"][number]} */
    const node = path.node;

    let type, value;
    if (t.isJSXExpressionContainer(node)) {
      type = "RUNTIME_TYPE";
      value = node.expression;
    } else if (t.isJSXSpreadChild(node)) {
      // <div>{...foo}</div>
      throw path.buildCodeFrameError(
        "Spread children are not supported. Please delete the ... token."
      );
    } else if (t.isJSXText(node)) {
      type = "STATIC_TYPE";

      // Empty text to insert a new line in the code, skip it
      if (node.value.trim() === "" && /[\r\n]/.test(node.value)) {
        return null;
      }

      value = t.stringLiteral(node.value);
    } else if (t.isJSXElement(node)) {
      type = "STATIC_TYPE";
      value = transformElement(path);
    } else if (t.isJSXFragment(node)) {
      type = "STATIC_TYPE";
      value = transformFragment(path);
    }

    return template.expression.ast`
      ESXToken.create(ESXToken.${t.identifier(type)}, ${value})
    `;
  }

  return { visitor, inherits: syntaxJSX.default };
}
