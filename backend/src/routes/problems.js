import express from "express";
import { v4 as uuidv4 } from "uuid";
import { problems, submissions, progress } from "../models/store.js";
import { executionEngine } from "../services/executionEngine.js";
import { requireAuth } from "../services/auth.js";

const router = express.Router();

// Anyone can browse problems, no auth needed just to look around.
router.get("/problems", (req, res) => {
  const { category, difficulty } = req.query;
  let list = [...problems.values()];

  if (category) list = list.filter((p) => p.category === category);
  if (difficulty) list = list.filter((p) => p.difficulty === difficulty);

  // Don't leak test cases in the list view, that's the whole challenge
  const safeList = list.map(({ testCases, ...rest }) => rest);
  res.json({ problems: safeList });
});

router.get("/problems/:id", (req, res) => {
  const problem = problems.get(req.params.id);
  if (!problem) {
    return res.status(404).json({ error: "Problem not found" });
  }
  // Still hide test cases here, submissions is where they actually get checked
  const { testCases, ...safe } = problem;
  res.json({ problem: safe });
});

// Submitting requires auth, we're tracking progress per user
router.post("/problems/:id/submit", requireAuth, async (req, res) => {
  const problem = problems.get(req.params.id);
  if (!problem) {
    return res.status(404).json({ error: "Problem not found" });
  }

  const { code } = req.body;
  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "code is required" });
  }

  const result = await executionEngine.submit(code, problem.testCases);

  const submissionId = uuidv4();
  const submission = {
    id: submissionId,
    userId: req.user.userId,
    problemId: problem.id,
    code,
    status: result.status,
    output: result,
    submittedAt: new Date().toISOString(),
  };
  submissions.set(submissionId, submission);

  const progressKey = `${req.user.userId}:${problem.id}`;
  const existing = progress.get(progressKey) || { solved: false, attempts: 0, bestSubmissionId: null };
  existing.attempts += 1;
  if (result.status === "passed") {
    existing.solved = true;
    existing.bestSubmissionId = submissionId;
  }
  progress.set(progressKey, existing);

  res.json({ submission });
});

// Progress tracking across all problems for the logged-in user
router.get("/progress", requireAuth, (req, res) => {
  const userProgress = [...progress.entries()]
    .filter(([key]) => key.startsWith(`${req.user.userId}:`))
    .map(([key, value]) => {
      const problemId = key.split(":")[1];
      const problem = problems.get(problemId);
      return {
        problemId,
        title: problem?.title,
        difficulty: problem?.difficulty,
        ...value,
      };
    });

  const solvedCount = userProgress.filter((p) => p.solved).length;

  res.json({
    totalSolved: solvedCount,
    totalProblems: problems.size,
    details: userProgress,
  });
});

export default router;
