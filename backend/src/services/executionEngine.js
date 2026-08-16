/**
 * executionEngine.js
 *
 * This is the piece I actually spent the most time on. Running
 * user-submitted code safely is the hard part of a platform like this,
 * you can't just eval() whatever someone types and hope for the best.
 *
 * Approach here: Node's built-in `vm` module gives us an isolated
 * context to run code in, separate from the main process's global
 * scope. It's not a full sandbox (vm module explicitly says not to use
 * it for untrusted code without extra hardening, a real production
 * version would run submissions in actual containers), but it's enough
 * to demonstrate the core problem: timeouts, output capture, and
 * handling multiple submissions without one bad submission blocking
 * everyone else.
 */

import vm from "node:vm";
import { EventEmitter } from "node:events";

const EXECUTION_TIMEOUT_MS = 3000;
const MAX_CONCURRENT_EXECUTIONS = 4;

class ExecutionEngine extends EventEmitter {
  constructor() {
    super();
    this._queue = [];
    this._activeCount = 0;
  }

  /**
   * Queues a submission for execution and returns a promise that
   * resolves once it's actually run. We cap concurrent executions
   * instead of letting everything run at once, a burst of submissions
   * (say, right before a deadline) shouldn't be able to bring the
   * whole process down.
   */
  submit(code, testCases) {
    return new Promise((resolve) => {
      this._queue.push({ code, testCases, resolve });
      this._tryDrainQueue();
    });
  }

  _tryDrainQueue() {
    while (this._activeCount < MAX_CONCURRENT_EXECUTIONS && this._queue.length > 0) {
      const job = this._queue.shift();
      this._activeCount++;
      this._runJob(job).finally(() => {
        this._activeCount--;
        this._tryDrainQueue();
      });
    }
  }

  async _runJob({ code, testCases, resolve }) {
    const result = this._executeWithTimeout(code, testCases);
    resolve(result);
  }

  /**
   * The actual execution. Wraps the submitted function definition in a
   * harness that calls it against each test case and compares output.
   *
   * A few things worth calling out:
   * - We capture console.log output separately so submissions can debug
   *   with print statements without it interfering with the return value.
   * - Errors (syntax errors, runtime exceptions, timeouts) all get
   *   caught and turned into a structured result instead of crashing
   *   the whole request.
   */
  _executeWithTimeout(code, testCases) {
    const logs = [];
    const sandbox = {
      console: {
        log: (...args) => logs.push(args.map(String).join(" ")),
      },
      __results__: [],
    };

    const context = vm.createContext(sandbox);

    // Figure out the function name from the code (assumes `function name(...)`
    // as the convention, matching our starter code templates).
    const fnNameMatch = code.match(/function\s+(\w+)\s*\(/);
    if (!fnNameMatch) {
      return {
        status: "error",
        error: "Could not find a function definition. Make sure your code defines a named function.",
        logs,
      };
    }
    const fnName = fnNameMatch[1];

    const testRunnerCode = `
      ${code}
      for (const tc of ${JSON.stringify(testCases)}) {
        try {
          const actual = ${fnName}(...tc.input);
          __results__.push({ actual, expected: tc.expected });
        } catch (err) {
          __results__.push({ error: err.message, expected: tc.expected });
        }
      }
    `;

    try {
      const script = new vm.Script(testRunnerCode);
      script.runInContext(context, { timeout: EXECUTION_TIMEOUT_MS });
    } catch (err) {
      const isTimeout = err.message.includes("Script execution timed out");
      return {
        status: isTimeout ? "timeout" : "runtime_error",
        error: isTimeout
          ? `Execution exceeded ${EXECUTION_TIMEOUT_MS}ms, check for infinite loops.`
          : err.message,
        logs,
      };
    }

    const results = sandbox.__results__;
    const allPassed = results.every(
      (r) => r.error === undefined && JSON.stringify(r.actual) === JSON.stringify(r.expected)
    );

    return {
      status: allPassed ? "passed" : "failed",
      results,
      logs,
    };
  }
}

// Single shared instance, mirrors how we'd want one execution pool
// shared across requests rather than spinning up a new one per submission.
export const executionEngine = new ExecutionEngine();
