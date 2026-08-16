# Coding Challenge Platform

A full-stack platform for browsing coding problems, submitting solutions,
and getting them checked in real time, similar in spirit to LeetCode.
Built as a team project where I served as team lead, coordinating task
distribution and the integration between frontend, backend, and the
execution engine.

This repo is a reconstructed, cleaned-up version of the core
architecture. The original team codebase wasn't preserved after the
project wrapped, but the design and the hardest problem we solved (safe,
timeout-bounded code execution under concurrent load) are represented
faithfully here.

## Architecture

- **Backend**: Node.js + Express, JWT auth, in-memory data store
- **Frontend**: React + Vite, React Router for navigation
- **Execution Engine**: The core piece. Runs submitted JavaScript safely
  using Node's `vm` module, with per-submission timeouts and a bounded
  concurrency queue so multiple people submitting at once don't take
  down the whole service

## The interesting engineering problem

Running arbitrary user-submitted code safely is the actual hard part of
a platform like this. The execution engine (`backend/src/services/executionEngine.js`)
handles a few things that matter:

- **Timeouts.** An infinite loop in a submission shouldn't hang the
  server. Each execution gets a hard timeout via `vm.Script`'s built-in
  timeout option.
- **Isolation.** Submitted code runs in a separate V8 context via
  `vm.createContext`, not in the same scope as the rest of the
  application. (Worth noting honestly: Node's `vm` module is explicitly
  documented as not a full security sandbox. A production version of
  this would run submissions in actual containers or a service like
  Firecracker. This implementation demonstrates the architecture and
  the timeout/concurrency handling, not a production-hardened sandbox.)
- **Concurrency without chaos.** A simple queue caps how many
  submissions execute simultaneously, so a burst of traffic degrades
  gracefully (submissions wait briefly) instead of everything trying to
  run at once.
- **Separating stdout from the return value.** Submissions can use
  `console.log` to debug without it interfering with how their actual
  return value gets checked against expected output.

## Running it

**Backend:**
```bash
cd backend
npm install
npm start
# Runs on http://localhost:3001
```

**Backend tests:**
```bash
cd backend
npm test
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173, proxies /api requests to the backend
```

You'll need the backend running for the frontend to actually work end
to end (registration, login, submitting code).

## What's simplified from the original

- **Database**: uses an in-memory store instead of PostgreSQL, so
  anyone can clone this and run it immediately with zero setup. The
  data models are structured close to how they'd map to real tables.
- **Problem set**: seeded with three sample problems instead of the
  full categorized set from the original build.
- **Language support**: JavaScript only here. The original supported
  submissions in a couple of languages via separate execution paths.

## Stack

Node.js, Express, JWT, bcrypt, React, React Router, Vite
