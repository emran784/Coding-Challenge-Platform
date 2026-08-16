import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function ProblemList() {
  const [problems, setProblems] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getProblems()
      .then((data) => setProblems(data.problems))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="error">Couldn't load problems: {error}</p>;

  return (
    <div>
      <h1>Problems</h1>
      <table className="problem-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Difficulty</th>
          </tr>
        </thead>
        <tbody>
          {problems.map((p) => (
            <tr key={p.id}>
              <td>
                <Link to={`/problems/${p.id}`}>{p.title}</Link>
              </td>
              <td>{p.category}</td>
              <td className={`difficulty-${p.difficulty}`}>{p.difficulty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
