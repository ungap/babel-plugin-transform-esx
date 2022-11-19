import fs from "fs";
import assert from "assert";
import * as prettier from "prettier";
import babel from "@babel/core";
import thisPlugin from "../src/index.js";

import { ESXToken } from "./esx-token.js";

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
      plugins: [thisPlugin],
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

test.finish();
