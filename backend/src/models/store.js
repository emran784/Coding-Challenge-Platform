/**
 * store.js
 *
 * A real deployment would use PostgreSQL (that's what we actually used
 * originally), but for a portfolio version that anyone can clone and run
 * with zero setup, an in-memory store keeps the friction down. The
 * models below are structured the same way they'd map to SQL tables,
 * swapping this out for a real DB layer later wouldn't require touching
 * the route logic much.
 */

const users = new Map();          // id -> { id, username, passwordHash, createdAt }
const problems = new Map();       // id -> { id, title, difficulty, category, description, starterCode, testCases }
const submissions = new Map();    // id -> { id, userId, problemId, code, status, output, submittedAt }
const progress = new Map();       // `${userId}:${problemId}` -> { solved, attempts, bestSubmissionId }

function seedProblems() {
  const seedData = [
    {
      id: "two-sum",
      title: "Two Sum",
      difficulty: "easy",
      category: "arrays",
      description: "Given an array of integers and a target, return the indices of the two numbers that add up to the target.",
      starterCode: "function twoSum(nums, target) {\n  // your code here\n}\n",
      testCases: [
        { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
        { input: [[3, 2, 4], 6], expected: [1, 2] },
      ],
    },
    {
      id: "reverse-string",
      title: "Reverse a String",
      difficulty: "easy",
      category: "strings",
      description: "Reverse a string in place-equivalent fashion (return the reversed string).",
      starterCode: "function reverseString(s) {\n  // your code here\n}\n",
      testCases: [
        { input: ["hello"], expected: "olleh" },
        { input: ["a"], expected: "a" },
      ],
    },
    {
      id: "valid-parens",
      title: "Valid Parentheses",
      difficulty: "medium",
      category: "stacks",
      description: "Determine if a string of brackets is validly matched and nested.",
      starterCode: "function isValid(s) {\n  // your code here\n}\n",
      testCases: [
        { input: ["()[]{}"], expected: true },
        { input: ["(]"], expected: false },
      ],
    },
  ];

  for (const p of seedData) {
    problems.set(p.id, p);
  }
}

seedProblems();

export { users, problems, submissions, progress };
