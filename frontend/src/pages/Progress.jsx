import React, { useState, useEffect } from "react";
import { api } from "../api.js";

export default function Progress() {
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getProgress()
      .then(setProgress)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!progress) return <p>Loading...</p>;

  return (
    <div>
      <h1>My Progress</h1>
      <p>
        Solved {progress.totalSolved} of {progress.totalProblems} problems
      </p>
      <ul className="progress-list">
        {progress.details.map((p) => (
          <li key={p.problemId}>
            {p.solved ? "✓" : "—"} {p.title} ({p.attempts} attempt{p.attempts !== 1 ? "s" : ""})
          </li>
        ))}
      </ul>
    </div>
  );
}
