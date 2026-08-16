/**
 * auth.js
 *
 * Straightforward JWT-based auth. Passwords are hashed with bcrypt
 * before they ever touch the store, never stored or compared in
 * plaintext.
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { users } from "../models/store.js";

// In a real deployment this comes from an environment variable, not
// hardcoded. Kept simple here since this is a portfolio/demo build.
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const SALT_ROUNDS = 10;

export async function registerUser(username, password) {
  const existing = [...users.values()].find((u) => u.username === username);
  if (existing) {
    throw new Error("Username already taken");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = {
    id: uuidv4(),
    username,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  users.set(user.id, user);

  return { id: user.id, username: user.username };
}

export async function loginUser(username, password) {
  const user = [...users.values()].find((u) => u.username === username);
  if (!user) {
    throw new Error("Invalid username or password");
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    throw new Error("Invalid username or password");
  }

  const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: "24h",
  });

  return { token, user: { id: user.id, username: user.username } };
}

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed authorization header" });
  }

  const token = authHeader.slice("Bearer ".length);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
