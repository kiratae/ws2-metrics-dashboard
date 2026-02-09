"use client";

import React, { useMemo, useState } from "react";

function getNextPath() {
  if (typeof window === "undefined") return "/dashboard";
  const usp = new URLSearchParams(window.location.search);
  return usp.get("next") || "/dashboard";
}

export default function LoginPage() {
  const nextPath = useMemo(getNextPath, []);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, pass, next: nextPath }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Login failed: ${res.status}`);
      }

      // server returns { redirectTo }
      const j = await res.json();
      window.location.href = j.redirectTo || "/dashboard";
    } catch (e: any) {
      setErr(e?.message ?? "Login failed");
      setLoading(false);
    } finally {
      // setLoading(false);
    }
  }

  return (
    <div className="container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <div className="card" style={{ width: 420 }}>
        <div className="h1" style={{ marginBottom: 6 }}>Login</div>
        <div className="small" style={{ marginBottom: 16 }}>Metrics dashboard access</div>

        <form onSubmit={submit}>
          <div className="field" style={{ marginBottom: 12, minWidth: "unset" }}>
            <label>Username</label>
            <input value={user} onChange={(e) => setUser(e.target.value)} autoFocus />
          </div>

          <div className="field" style={{ marginBottom: 12, minWidth: "unset" }}>
            <label>Password</label>
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
          </div>

          {err ? <div className="footerNote" style={{ color: "#ffb4b4", marginTop: 8 }}>{err}</div> : null}

          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 16 }}>
            <button type="submit" disabled={loading || !user || !pass} style={{ flex: 1 }}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
            <a className="badge" href={nextPath}>Back</a>
          </div>

          <div className="footerNote" style={{ marginTop: 14 }}>
            Session is stored in an HTTP-only cookie.
          </div>
        </form>
      </div>
    </div>
  );
}
