import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { executionEngine } from "../src/services/executionEngine.js";

describe("ExecutionEngine", () => {
  test("runs correct code and reports all tests passing", async () => {
    const code = "function add(a, b) {\n  return a + b;\n}";
    const testCases = [
      { input: [1, 2], expected: 3 },
      { input: [5, 5], expected: 10 },
    ];

    const result = await executionEngine.submit(code, testCases);
    assert.equal(result.status, "passed");
    assert.equal(result.results.length, 2);
  });

  test("reports failed status when output does not match expected", async () => {
    const code = "function add(a, b) {\n  return a - b;\n}"; // deliberately wrong
    const testCases = [{ input: [5, 3], expected: 8 }];

    const result = await executionEngine.submit(code, testCases);
    assert.equal(result.status, "failed");
    assert.equal(result.results[0].actual, 2);
    assert.equal(result.results[0].expected, 8);
  });

  test("catches runtime errors instead of crashing", async () => {
    const code = "function crashes(a) {\n  return a.someMethodThatDoesNotExist();\n}";
    const testCases = [{ input: [1], expected: 1 }];

    const result = await executionEngine.submit(code, testCases);
    // The error surfaces inside the per-test-case result, not a top-level crash
    assert.equal(result.status, "failed");
    assert.ok(result.results[0].error);
  });

  test("times out on an infinite loop instead of hanging forever", { timeout: 5000 }, async () => {
    const code = "function infiniteLoop(a) {\n  while (true) {}\n  return a;\n}";
    const testCases = [{ input: [1], expected: 1 }];

    const result = await executionEngine.submit(code, testCases);
    assert.equal(result.status, "timeout");
  });

  test("captures console.log output separately from the return value", async () => {
    const code = "function withLogging(a) {\n  console.log('debugging:', a);\n  return a * 2;\n}";
    const testCases = [{ input: [4], expected: 8 }];

    const result = await executionEngine.submit(code, testCases);
    assert.equal(result.status, "passed");
    assert.ok(result.logs.some((l) => l.includes("debugging")));
  });

  test("handles missing function definition gracefully", async () => {
    const code = "const notAFunction = 42;";
    const testCases = [{ input: [1], expected: 1 }];

    const result = await executionEngine.submit(code, testCases);
    assert.equal(result.status, "error");
  });

  test("processes multiple concurrent submissions without interference", async () => {
    const makeCode = (multiplier) =>
      `function multiply(a) { return a * ${multiplier}; }`;

    const submissions = [1, 2, 3, 4, 5].map((multiplier) =>
      executionEngine.submit(makeCode(multiplier), [{ input: [10], expected: 10 * multiplier }])
    );

    const results = await Promise.all(submissions);
    for (const result of results) {
      assert.equal(result.status, "passed");
    }
  });
});
