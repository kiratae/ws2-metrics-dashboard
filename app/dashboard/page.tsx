"use client";

import React, { useEffect, useMemo, useState } from "react";
import { fetchLatencyTimeseries, fetchRequestsTimeseries, Granularity } from "@/lib/api";
import { LatencyChart, RequestsChart } from "@/components/Charts";
import ThemeToggle from "@/components/ThemeToggle";

function isoLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

function defaultRange() {
  const now = new Date();
  const to = new Date(now);
  const from = new Date(now);
  from.setHours(now.getHours() - 6);
  return { from, to };
}

function fmtInt(n: number) {
  return new Intl.NumberFormat().format(n);
}

function pct(n: number) {
  return (n * 100).toFixed(2) + "%";
}

type Preset =
  | "custom"
  | "15m"
  | "1h"
  | "6h"
  | "24h"
  | "7d";

function applyPreset(p: Preset) {
  const now = new Date();
  const to = isoLocal(now);

  const fromDate = new Date(now);
  switch (p) {
    case "15m": fromDate.setMinutes(now.getMinutes() - 15); break;
    case "1h":  fromDate.setHours(now.getHours() - 1); break;
    case "6h":  fromDate.setHours(now.getHours() - 6); break;
    case "24h": fromDate.setHours(now.getHours() - 24); break;
    case "7d":  fromDate.setDate(now.getDate() - 7); break;
    default:    break;
  }

  return { from: isoLocal(fromDate), to };
}

export default function DashboardPage() {
  const apiBase = process.env.NEXT_PUBLIC_METRICS_API_BASE || "http://localhost:5000";

  const [preset, setPreset] = useState<Preset>("6h");
  const { from: dFrom, to: dTo } = useMemo(defaultRange, []);
  const [from, setFrom] = useState<string>(isoLocal(dFrom));
  const [to, setTo] = useState<string>(isoLocal(dTo));
  const [granularity, setGranularity] = useState<Granularity>("auto");
  const [companyId, setCompanyId] = useState<string>("");
  const [formTypeId, setFormTypeId] = useState<string>("");

  const [reqData, setReqData] = useState<any[]>([]);
  const [latData, setLatData] = useState<any[]>([]);
  const [reqGran, setReqGran] = useState<string>("-");
  const [latGran, setLatGran] = useState<string>("-");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const kpi = useMemo(() => {
    const totalStarted = reqData.reduce((a, p) => a + (p.started ?? 0), 0);
    const c2xx = reqData.reduce((a, p) => a + (p.c2xx ?? 0), 0);
    const c4xx = reqData.reduce((a, p) => a + (p.c4xx ?? 0), 0);
    const c5xx = reqData.reduce((a, p) => a + (p.c5xx ?? 0), 0);
    const completed = c2xx + c4xx + c5xx;

    const successRate = completed > 0 ? c2xx / completed : 0;
    const errRate = completed > 0 ? (c4xx + c5xx) / completed : 0;
    const err5xxRate = completed > 0 ? c5xx / completed : 0;

    const avgs = latData.map((p) => p.avgAllMs).filter((x: any) => typeof x === "number") as number[];
    const avgAllMs = avgs.length ? avgs.reduce((a, b) => a + b, 0) / avgs.length : null;

    return { totalStarted, completed, c2xx, c4xx, c5xx, successRate, errRate, err5xxRate, avgAllMs };
  }, [reqData, latData]);

  async function load() {
    setLoading(true);
    setError("");
    const ac = new AbortController();

    try {
      const [r, l] = await Promise.all([
        fetchRequestsTimeseries({
          apiBase,
          from,
          to,
          granularity,
          companyId: companyId || undefined,
          formTypeId: formTypeId || undefined,
          signal: ac.signal,
        }),
        fetchLatencyTimeseries({
          apiBase,
          from,
          to,
          granularity,
          companyId: companyId || undefined,
          formTypeId: formTypeId || undefined,
          signal: ac.signal,
        }),
      ]);

      setReqGran(r.granularity);
      setLatGran(l.granularity);
      setReqData(r.points ?? []);
      setLatData(l.points ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load metrics");
    } finally {
      setLoading(false);
    }

    return () => ac.abort();
  }

  
async function logout() {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } finally {
    window.location.href = "/login";
  }
}
useEffect(() => {
    const r = applyPreset("6h");
    setFrom(r.from);
    setTo(r.to);
    setPreset("6h");
    // แล้วค่อย load หลัง set state (วิธีง่าย: setTimeout 0)
    setTimeout(() => { void load(); }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container">
      <div className="header">
        <div>
          <div className="h1">WS2 Metrics Dashboard</div>
          <div className="small" style={{ marginTop: 8 }}>
            API base: <span className="badge" style={{ padding: "4px 8px" }}>{apiBase}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <ThemeToggle />
          <button className="iconBtn" onClick={() => void logout()} title="Logout">↩︎</button>
          <div className="badge">
            requests: {reqGran} • latency: {latGran}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row">
          <div className="field">
            <label>Range</label>
            <select
              value={preset}
              onChange={(e) => {
                const p = e.target.value as Preset;
                setPreset(p);
                if (p !== "custom") {
                  const r = applyPreset(p);
                  setFrom(r.from);
                  setTo(r.to);
                }
              }}
            >
              <option value="custom">custom</option>
              <option value="15m">last 15m</option>
              <option value="1h">last 1h</option>
              <option value="6h">last 6h</option>
              <option value="24h">last 24h</option>
              <option value="7d">last 7d</option>
            </select>
          </div>

          <div className="field">
            <label>Now</label>
            <button
              type="button"
              onClick={() => {
                const now = isoLocal(new Date());
                setTo(now);
              }}
            >
              Set To = Now
            </button>
          </div>
          <div className="field">
            <label>From (local)</label>
            <input
              type="datetime-local"
              step={60}
              value={from.slice(0, 16)}
              onChange={(e) => {
                setPreset("custom");
                setFrom(e.target.value + ":00");
              }}
            />
          </div>

          <div className="field">
            <label>To (local)</label>
            <input
              type="datetime-local"
              step={60}
              value={to.slice(0, 16)}
              onChange={(e) => {
                setPreset("custom");
                setTo(e.target.value + ":00");
              }}
            />
          </div>
          <div className="field">
            <label>Granularity</label>
            <select value={granularity} onChange={(e) => setGranularity(e.target.value as Granularity)}>
              <option value="auto">auto</option>
              <option value="m5">5m</option>
              <option value="hour">hour</option>
              <option value="day">day</option>
            </select>
          </div>
          <div className="field">
            <label>CompanyId (optional)</label>
            <input placeholder="e.g. 475461" value={companyId} onChange={(e) => setCompanyId(e.target.value)} />
          </div>
          <div className="field">
            <label>FormType</label>
            <select value={formTypeId} onChange={(e) => setFormTypeId(e.target.value)}>
              <option value="">all</option>
              <option value="1">Policy</option>
              <option value="2">Payment</option>
              <option value="3">Claim</option>
            </select>
          </div>
          <div className="field">
            <label>&nbsp;</label>
            <button onClick={() => void load()} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {error ? <div className="footerNote" style={{ color: "#ffb4b4" }}>{error}</div> : null}
      </div>

      <div className="kpis" style={{ marginBottom: 16 }}>
        <div className="kpi">
          <div className="k">Completed</div>
          <div className="v">{fmtInt(kpi.completed)}</div>
          <div className="small">Started: {fmtInt(kpi.totalStarted)}</div>
        </div>
        <div className="kpi">
          <div className="k">Success rate</div>
          <div className="v">{pct(kpi.successRate)}</div>
          <div className="small">2xx: {fmtInt(kpi.c2xx)}</div>
        </div>
        <div className="kpi">
          <div className="k">Error rate</div>
          <div className="v">{pct(kpi.errRate)}</div>
          <div className="small">4xx: {fmtInt(kpi.c4xx)} • 5xx: {fmtInt(kpi.c5xx)}</div>
        </div>
        <div className="kpi">
          <div className="k">Avg latency (all)</div>
          <div className="v">{kpi.avgAllMs === null ? "-" : `${Math.round(kpi.avgAllMs)} ms`}</div>
          <div className="small">Mean of timepoints</div>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h2>Requests (stacked by status) + Started</h2>
          <RequestsChart data={reqData} granularity={reqGran} />
        </div>
        <div className="card">
          <h2>Latency (avg ms by statusGroup)</h2>
          <LatencyChart data={latData} granularity={latGran} />
        </div>
      </div>

      <div className="footerNote">
        Set <code>NEXT_PUBLIC_METRICS_API_BASE</code> and <code>NEXT_PUBLIC_METRICS_ACCESS_TOKEN</code> in Vercel env. Basic-auth uses <code>DASH_USER</code>/<code>DASH_PASS</code>.
      </div>
    </div>
  );
}
