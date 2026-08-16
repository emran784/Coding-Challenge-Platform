import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api.js";

export default function ProblemDetail() {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getProblem(id)
      .then((data) => {
        setProblem(data.problem);
        setCode(data.problem.starterCode);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  async function handleSubmit() {
    setSubmitting(true);
    setResult(null);
    setError(null);
    try {
      const data = await api.submitCode(id, code);
      setResult(data.submission);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !problem) return <p className="error">{error}</p>;
  if (!problem) return <p>Loading...</p>;

  return (
    <div className="problem-detail">
      <h1>{problem.title}</h1>
      <p className={`difficulty-${problem.difficulty}`}>{problem.difficulty}</p>
      <p>{problem.description}</p>

      <textarea
        className="code-editor"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        rows={12}
      />

      <button onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Running..." : "Submit"}
      </button>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className={`result result-${result.status}`}>
          <h3>
            {result.status === "passed" && "All tests passed"}
            {result.status === "failed" && "Some tests failed"}
            {result.status === "timeout" && "Execution timed out"}
            {(result.status === "runtime_error" || result.status === "error") && "Error"}
          </h3>

          {result.output.error && <pre className="error-text">{result.output.error}</pre>}

          {result.output.results && (
            <ul className="test-results">
              {result.output.results.map((r, i) => (
                <li key={i} className={r.error || JSON.stringify(r.actual) !== JSON.stringify(r.expected) ? "fail" : "pass"}>
                  {r.error ? (
                    <span>Test {i + 1}: threw an error, {r.error}</span>
                  ) : (
                    <span>
                      Test {i + 1}: got {JSON.stringify(r.actual)}, expected {JSON.stringify(r.expected)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
