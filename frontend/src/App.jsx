import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { api } from "./api.js";
import ProblemList from "./pages/ProblemList.jsx";
import ProblemDetail from "./pages/ProblemDetail.jsx";
import Progress from "./pages/Progress.jsx";
import Login from "./pages/Login.jsx";

function useAuth() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return { user, login, logout };
}

function NavBar({ user, onLogout }) {
  const navigate = useNavigate();
  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        Coding Challenge Platform
      </Link>
      <div className="nav-links">
        <Link to="/">Problems</Link>
        {user && <Link to="/progress">My Progress</Link>}
        {user ? (
          <>
            <span className="username">{user.username}</span>
            <button
              onClick={() => {
                onLogout();
                navigate("/login");
              }}
            >
              Log out
            </button>
          </>
        ) : (
          <Link to="/login">Log in</Link>
        )}
      </div>
    </nav>
  );
}

function RequireAuth({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user, login, logout } = useAuth();

  return (
    <BrowserRouter>
      <NavBar user={user} onLogout={logout} />
      <main className="content">
        <Routes>
          <Route path="/" element={<ProblemList />} />
          <Route path="/problems/:id" element={<ProblemDetail />} />
          <Route path="/login" element={<Login onLogin={login} />} />
          <Route
            path="/progress"
            element={
              <RequireAuth user={user}>
                <Progress />
              </RequireAuth>
            }
          />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
