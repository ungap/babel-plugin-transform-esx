import fs from "fs";
import assert from "assert";
import * as prettier from "prettier";
import babel from "@babel/core";
import thisPlugin from "../src/index.js";

// TODO: find a way to use the source instead of manually maintain its parsed outcome
// import ESXTokenSource from "../src/inline.js";

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
      `ESXToken.e(_templateReference, "div", ESXToken._);`
  );

  assert.strictEqual(
    withOpts({ polyfill: "inline" }),
    `var _templateReference = {};\n` +
      `globalThis.ESXToken || (globalThis.ESXToken = ((properties, _, ATTRIBUTE, COMPONENT, ELEMENT, FRAGMENT, INTERPOLATION, STATIC) => class ESXToken { static ATTRIBUTE = ATTRIBUTE; static COMPONENT = COMPONENT; static ELEMENT = ELEMENT; static FRAGMENT = FRAGMENT; static INTERPOLATION = INTERPOLATION; static STATIC = STATIC; static _ = _; static a = (dynamic, name, value) => ({ type: ATTRIBUTE, dynamic, name, value }); static i = value => ({ type: INTERPOLATION, value }); static s = value => ({ type: STATIC, value }); static c = (id, value, attributes, children = _) => new ESXToken(COMPONENT, id, children, attributes, value); static e = (id, name, attributes, children = _) => new ESXToken(ELEMENT, id, children, attributes, name); static f = (id, children) => new ESXToken(FRAGMENT, id, children, null, null); constructor(type, id, children, attributes, value) { this.type = type; this.id = id; this.children = children; this.attributes = attributes; this.value = value; } get properties() { const { attributes } = this; return attributes === _ ? null : attributes.reduce(properties, {}); } })((props, item) => item.type === 5 ? Object.assign(props, item.value) : (props[item.name] = item.value, props), [], 1, 2, 3, 4, 5, 6));\n` +
      `ESXToken.e(_templateReference, "div", ESXToken._);`
  );

  assert.strictEqual(
    withOpts({ polyfill: "import" }),
    `var _templateReference = {};\n` +
      `import ESXToken from "@ungap/esxtoken";\n` +
      `ESXToken.e(_templateReference, "div", ESXToken._);`
  );

  // Default is import
  assert.strictEqual(withOpts({}), withOpts({ polyfill: "import" }));
});

test("type of element attributes", () => {
  const cases = [
    ["<div a />", <div a />, [{type: ESXToken.ATTRIBUTE, dynamic: false, name: "a", value: true}]],
    ["<div a='a' />", <div a="a" />, [{type: ESXToken.ATTRIBUTE, dynamic: false, name: "a", value: "a"}]],
    ["<div a={1} />", <div a={1} />, [{type: ESXToken.ATTRIBUTE, dynamic: true, name: "a", value: 1}]],
    ["<div a={1} b />", <div a={1} b />, [{type: ESXToken.ATTRIBUTE, dynamic: true, name: "a", value: 1}, {type: ESXToken.ATTRIBUTE, dynamic: false, name: "b", value: true}]],
    ["<div a b={1} />", <div a b={1} />, [{type: ESXToken.ATTRIBUTE, dynamic: false, name: "a", value: true}, {type: ESXToken.ATTRIBUTE, dynamic: true, name: "b", value: 1}]],
    ["<div a={1} b={2} />", <div a={1} b={2} />, [{type: ESXToken.ATTRIBUTE, dynamic: true, name: "a", value: 1}, {type: ESXToken.ATTRIBUTE, dynamic: true, name: "b", value: 2}]],
    ["<div {...test} />", <div {...test} />, [{type: ESXToken.INTERPOLATION, value: test}]],
    ["<div a {...test} />", <div a {...test} />, [{type: ESXToken.ATTRIBUTE, dynamic: false, name: "a", value: true}, {type: ESXToken.INTERPOLATION, value: test}]],
    ["<div {...test} a />", <div {...test} a />, [{type: ESXToken.INTERPOLATION, value: test}, {type: ESXToken.ATTRIBUTE, dynamic: false, name: "a", value: true}]],
    ["<div a={1} {...test} />", <div a={1} {...test} />, [{type: ESXToken.ATTRIBUTE, dynamic: true, name: "a", value: 1}, {type: ESXToken.INTERPOLATION, value: test}]],
    ["<div {...test} a={1} />", <div {...test} a={1} />, [{type: ESXToken.INTERPOLATION, value: test}, {type: ESXToken.ATTRIBUTE, dynamic: true, name: "a", value: 1}]],
  ];

  for (const [desc, {attributes}, expectations] of cases) {
    assert.strictEqual(attributes.length, expectations.length, desc);
    for (let i = 0; i < attributes.length; i++) {
      const attribute = attributes[i];
      const expectation = expectations[i];
      assert.strictEqual(attribute.type, expectation.type, desc);
      assert.strictEqual(attribute.value, expectation.value, desc);
      if (attribute.type === ESXToken.ATTRIBUTE) {
        assert.strictEqual(attribute.name, expectation.name, desc);
        assert.strictEqual(attribute.dynamic, expectation.dynamic, desc);
      }
    }
  }
});

test("no children", () => {
  assert.strictEqual(
    (
      <div />
    ).children.length,
    0
  );

  assert.strictEqual(
    (
      <div />
    ).children,
    ESXToken._
  );
});

test("newlines in children are collapsed", () => {
  assert.strictEqual(
    (
      <div>
        <span />
      </div>
    ).children.length,
    1
  );

  assert.strictEqual(
    (
      <div>
        <span />
        <span />
      </div>
    ).children.length,
    2
  );

  assert.strictEqual(
    (
      <div>
        <span /> <span />
      </div>
    ).children.length,
    3
  );
});

test("supports xml namespaces", () => {
  const elem = <xml:svg xmlns:xlink="http://www.w3.org/1999/xlink" />;

  assert.strictEqual(elem.value, "xml:svg");
  assert.strictEqual(elem.attributes[0].name, "xmlns:xlink");
});

test("spread props are represented as interpolations", () => {
  const obj = {};
  const elem = <div {...obj} />;

  assert.strictEqual(elem.attributes[0].type, ESXToken.INTERPOLATION);
  assert.strictEqual(elem.attributes[0].value, obj);
});

test("fragments", () => {
  const frag = (
    <>
      <p />
      <div />
    </>
  );

  assert.strictEqual(frag.type, ESXToken.FRAGMENT);
  assert.strictEqual(frag.children.length, 2);
  assert.strictEqual(frag.attributes, null);
});

test.finish();
