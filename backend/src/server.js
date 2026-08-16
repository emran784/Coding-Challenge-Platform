import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import problemRoutes from "./routes/problems.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api", problemRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Keeping the listen call out of a top-level side effect makes this
// importable for tests without actually binding a port.
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
