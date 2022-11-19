import fs from "fs";
import assert from "assert/strict";
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
      assert.equal(transformed, expected);
    } catch (err) {
      err.message += `\nIf the new output is expected, delete ${outputPath} to regenerate it.`;
      throw err;
    }
  }
});

test("type of element attributes", () => {
  assert.equal(
    (<div a b="b" />).value.properties.type,
    ESXToken.STATIC_TYPE,
    `<div a b="b" /> only has static properties`
  );

  assert.equal(
    (<div a={test} />).value.properties.type,
    ESXToken.RUNTIME_TYPE,
    `<div a={test} /> only has runtime properties`
  );

  assert.equal(
    (<div x a={test} />).value.properties.type,
    ESXToken.MIXED_TYPE,
    `<div x a={test} /> has mixed properties`
  );

  assert.equal(
    (<div a={test} x />).value.properties.type,
    ESXToken.MIXED_TYPE,
    `<div a={test} x /> has mixed properties`
  );

  assert.equal(
    (<div x {...test} />).value.properties.type,
    ESXToken.RUNTIME_TYPE,
    `<div x {...test} /> is fully runtime because of the spread`
  );
});

test("newlines in children are collapsed", () => {
  assert.equal(
    (
      <div>
        <span />
      </div>
    ).value.children.length,
    1
  );

  assert.equal(
    (
      <div>
        <span />
        <span />
      </div>
    ).value.children.length,
    2
  );

  assert.equal(
    (
      <div>
        <span /> <span />
      </div>
    ).value.children.length,
    3
  );
});

test.finish();