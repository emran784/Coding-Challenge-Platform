import express from "express";
import { registerUser, loginUser } from "../services/auth.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "password must be at least 6 characters" });
  }

  try {
    const user = await registerUser(username, password);
    res.status(201).json({ user });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  try {
    const { token, user } = await loginUser(username, password);
    res.json({ token, user });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

export default router;
