import syntaxJSX from "@babel/plugin-syntax-jsx";
import { getInlinePolyfill, getExternalPolyfill } from "./polyfill.js";

/**
 * @param {import("@babel/core")} babelApi
 */
export default function ({ template, types: t }, { polyfill = "import" } = {}) {
  if (polyfill !== false && polyfill !== "inline" && polyfill !== "import") {
    throw new Error(
      `The .polyfill option must be one of: false, "inline", "import".`
    );
  }

  /** @type {import("@babel/core").Visitor} */
  const visitor = {
    JSXElement(path) {
      path.replaceWith(transformElement(path, buildReference(path)));
    },
    JSXFragment(path) {
      path.replaceWith(transformFragment(path, buildReference(path)));
    },
  };

  const polyfillInjected = new WeakSet();

  const getChildren = path => path.get("children").map(transformChild).filter(Boolean);

  const getDirectMember = nmsp => t.memberExpression.apply(
    t, nmsp.split(".").map(x => t.identifier(x))
  );

  const invoke = (nmsp, ...args) => t.callExpression(getDirectMember(nmsp), args);

  function buildReference({scope}) {
    const ref = scope.generateUidIdentifier("templateReference");
    const programScope = scope.getProgramParent();
    programScope.push({ id: t.cloneNode(ref), init: t.objectExpression([]) });

    ensurePolyfill(programScope.path);
    return ref;
  }

  function ensurePolyfill(programPath) {
    if (!polyfill || polyfillInjected.has(programPath.node)) return;
    polyfillInjected.add(programPath.node);

    if (programPath.scope.hasBinding("ESXToken")) return;
    programPath.unshiftContainer(
      "body",
      polyfill === "inline"
        ? getInlinePolyfill(template)
        : getExternalPolyfill(template)
    );
  }

  function transformElement(path, ref) {
    /** @type {import("@babel/types").JSXElement} */
    const node = path.node;
    const jsxElementName = node.openingElement.name;

    let factory = "ESXToken.";
    let element;
    if (
      t.isJSXNamespacedName(jsxElementName) ||
      (t.isJSXIdentifier(jsxElementName) && /^[a-z]/.test(jsxElementName.name))
    ) {
      factory += "e";
      element = jsxToString(jsxElementName);
    } else {
      factory += "c";
      element = jsxToJS(jsxElementName);
    }

    const children = getChildren(path);
    const attributes = transformAttributesList(path.get("openingElement"));

    return children.length ?
      invoke(factory, ref, element, attributes, t.arrayExpression(children)) :
      invoke(factory, ref, element, attributes);
  }

  function transformFragment(path, ref) {
    const children = getChildren(path);
    return invoke("ESXToken.f", ref, t.arrayExpression(children));
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

    return node.attributes.length === 0 ?
      getDirectMember("ESXToken._") :
      t.arrayExpression(path.get("attributes").map(transformAttribute));
  }

  function transformAttribute(path) {
    /** @type {import("@babel/types").JSXAttribute | import("@babel/types").JSXSpreadAttribute} */
    const node = path.node;

    if (t.isJSXSpreadAttribute(node)) {
      return t.inherits(
        invoke("ESXToken.i", node.argument),
        node
      );
    }

    let dynamic = false, name, value;
    if (t.isJSXExpressionContainer(node.value)) {
      dynamic = true;
      name = jsxToString(node.name);
      value = node.value.expression;
    } else if (t.isJSXElement(node.value) || t.isJSXFragment(node.value)) {
      throw path
        .get("value")
        .buildCodeFrameError(
          "JSX elements are not supported as static attributes. Please wrap it in { }."
        );
    } else if (node.value) {
      name = jsxToString(node.name);
      value = node.value;
    } else {
      name = jsxToString(node.name);
      value = t.booleanLiteral(true);
    }

    return t.inherits(
      invoke("ESXToken.a", t.booleanLiteral(dynamic), name, value),
      node
    );
  }

  function transformChild(path) {
    /** @type {import("@babel/types").JSXElement["children"][number]} */
    const node = path.node;

    if (t.isJSXExpressionContainer(node))
      return invoke("ESXToken.i", node.expression);

    if (t.isJSXSpreadChild(node)) {
      // <div>{...foo}</div>
      throw path.buildCodeFrameError(
        "Spread children are not supported. Please delete the ... token."
      );
    } else if (t.isJSXText(node)) {
      // Empty text to insert a new line in the code, skip it
      if (node.value.trim() === "" && /[\r\n]/.test(node.value)) {
        return null;
      }

      return invoke("ESXToken.s", t.stringLiteral(node.value));
    } else if (t.isJSXElement(node)) {
      return transformElement(path, t.nullLiteral());
    } else if (t.isJSXFragment(node)) {
      return transformFragment(path, t.nullLiteral());
    }
  }

  return { visitor, inherits: syntaxJSX.default };
}
