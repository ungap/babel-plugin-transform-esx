import fs from "fs";
import assert from "assert";
import * as prettier from "prettier";
import babel from "@babel/core";
import thisPlugin from "../src/index.js";

function test(desc, run) {
  try {
    run();
    console.log(`✅ ${desc}`);
    test.successes++;
  } catch (err) {
    console.log(`❌ ${desc}`);
    console.log(String(err.stack).replace(/^/gm, "\t"));
    test.failures++;
  }
}
test.successes = 0;
test.failures = 0;
test.finish = () => {
  console.log(`\n${test.successes} successes, ${test.failures} failures`);
  process.exitCode = test.failures > 0 ? 1 : 0;
};

test("transform", () => {
  const inputPath = new URL("./transform/input.js", import.meta.url).pathname;
  const outputPath = new URL("./transform/output.js", import.meta.url).pathname;

  const transformed = prettier.format(
    babel.transformFileSync(inputPath, {
      configFile: false,
      plugins: [[thisPlugin, { polyfill: "import" }]],
    }).code
  );

  if (!fs.existsSync(outputPath)) {
    console.info("Writing output file");
    fs.writeFileSync(outputPath, transformed);
  } else {
    const expected = fs.readFileSync(outputPath, "utf8");
    try {
      assert.strictEqual(transformed, expected);
    } catch (err) {
      err.message += `\nIf the new output is expected, delete ${outputPath} to regenerate it.`;
      throw err;
    }
  }
});

test("'polyfill' option", () => {
  const withOpts = (options) =>
    babel.transformSync("<div />;", {
      configFile: false,
      plugins: [[thisPlugin, options]],
    }).code;

  assert.strictEqual(
    withOpts({ polyfill: false }),
    `var _templateReference = {};\n` +
      `ESXToken.template(_templateReference, ESXToken.element("div", null));`
  );

  assert.strictEqual(
    withOpts({ polyfill: "inline" }),
    `var _templateReference = {};\n` +
      `globalThis.ESXToken || (globalThis.ESXToken = class ESXToken { static STATIC_TYPE = 1 << 0; static MIXED_TYPE = 1 << 1; static RUNTIME_TYPE = 1 << 2; static TEMPLATE_TYPE = 1 << 3; static ELEMENT_TYPE = 1 << 6; static FRAGMENT_TYPE = 1 << 7; static COMPONENT_TYPE = 1 << 8; static create = (type, value) => ({ __proto__: ESXToken.prototype, type, value }); static property = (type, name, value) => ({ __proto__: ESXToken.prototype, type, name, value }); static template = (id, value) => ({ __proto__: ESXToken.prototype, type: ESXToken.TEMPLATE_TYPE, id, value }); static chevron = (type, value, properties, children) => ({ __proto__: ESXToken.prototype, type, value, properties, children }); static fragment = (...children) => ESXToken.chevron(ESXToken.FRAGMENT_TYPE, null, null, children); static element = (tag, properties, ...children) => ESXToken.chevron(ESXToken.ELEMENT_TYPE, tag, properties, children); static component = (fn, properties, ...children) => ESXToken.chevron(ESXToken.COMPONENT_TYPE, fn, properties, children); });\n` +
      `ESXToken.template(_templateReference, ESXToken.element("div", null));`
  );

  assert.strictEqual(
    withOpts({ polyfill: "import" }),
    `var _templateReference = {};\n` +
      `import ESXToken from "@ungap/esxtoken";\n` +
      `ESXToken.template(_templateReference, ESXToken.element("div", null));`
  );

  // Default is inline
  assert.strictEqual(withOpts({}), withOpts({ polyfill: "inline" }));
});

test("type of element attributes", () => {
  const cases = [
    ["<div a />", <div a />, ESXToken.STATIC_TYPE],
    ["<div a='a' />", <div a="a" />, ESXToken.STATIC_TYPE],
    ["<div a={1} />", <div a={1} />, ESXToken.MIXED_TYPE],
    ["<div a={1} b />", <div a={1} b />, ESXToken.MIXED_TYPE],
    ["<div a b={1} />", <div a b={1} />, ESXToken.MIXED_TYPE],
    ["<div a={1} b={2} />", <div a={1} b={2} />, ESXToken.MIXED_TYPE],
    ["<div {...test} />", <div {...test} />, ESXToken.RUNTIME_TYPE],
    ["<div a {...test} />", <div a {...test} />, ESXToken.RUNTIME_TYPE],
    ["<div {...test} a />", <div {...test} a />, ESXToken.RUNTIME_TYPE],
    ["<div a={1} {...test} />", <div a={1} {...test} />, ESXToken.RUNTIME_TYPE],
    ["<div {...test} a={1} />", <div {...test} a={1} />, ESXToken.RUNTIME_TYPE],
  ];

  for (const [desc, element, expectedType] of cases) {
    assert.strictEqual(element.value.properties.type, expectedType, desc);
  }
});

test("newlines in children are collapsed", () => {
  assert.strictEqual(
    (
      <div>
        <span />
      </div>
    ).value.children.length,
    1
  );

  assert.strictEqual(
    (
      <div>
        <span />
        <span />
      </div>
    ).value.children.length,
    2
  );

  assert.strictEqual(
    (
      <div>
        <span /> <span />
      </div>
    ).value.children.length,
    3
  );
});

test("supports xml namespaces", () => {
  const elem = <xml:svg xmlns:xlink="http://www.w3.org/1999/xlink" />;

  assert.strictEqual(elem.value.value, "xml:svg");
  assert.strictEqual(elem.value.properties.value[0].name, "xmlns:xlink");
});

test("spread props are represented as a runtime prop with empty name", () => {
  const obj = {};
  const elem = <div {...obj} />;

  assert.strictEqual(elem.value.properties.value[0].name, "");
  assert.strictEqual(elem.value.properties.value[0].value, obj);
  assert.strictEqual(
    elem.value.properties.value[0].type,
    ESXToken.RUNTIME_TYPE
  );
});

test("fragments", () => {
  const frag = (
    <>
      <p />
      <div />
    </>
  );

  assert.strictEqual(frag.value.type, ESXToken.FRAGMENT_TYPE);
  assert.strictEqual(frag.value.properties, null);
  assert.strictEqual(frag.value.children.length, 2);
});

test.finish();
