"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

function formatTimeLabel(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function CustomTooltip({ active, label, payload }: any) {
  if (!active || !payload || !payload.length) return null;

  // payload items include value + name; filter undefined values
  const items = payload
    .filter((p: any) => p && typeof p.value === "number")
    // Prefer stable order: 2xx,4xx,5xx,Started, then others
    .sort((a: any, b: any) => {
      const order = (n: string) => {
        const s = String(n).toLowerCase();
        if (s.includes("2xx")) return 1;
        if (s.includes("4xx")) return 2;
        if (s.includes("5xx")) return 3;
        if (s.includes("started")) return 4;
        if (s.includes("all")) return 5;
        return 9;
      };
      return order(a.name) - order(b.name);
    });

  const title = label ? formatTimeLabel(String(label)) : "";

  return (
    <div className="chartTooltip">
      <div className="t">{title}</div>
      {items.map((p: any) => (
        <div className="row" key={p.dataKey ?? p.name}>
          <span className="k">{p.name}</span>
          <span className="v">{Number(p.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}


export function RequestsChart({ data }: { data: any[] }) {
  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis dataKey="t" tickFormatter={formatTimeLabel} minTickGap={24} tick={{ fill: "var(--text)", fontSize: 12 }} />
          <YAxis tick={{ fill: "var(--text)", fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: "var(--text)" }} />
          <Area type="monotone" dataKey="c2xx" stackId="1" name="2xx" />
          <Area type="monotone" dataKey="c4xx" stackId="1" name="4xx" />
          <Area type="monotone" dataKey="c5xx" stackId="1" name="5xx" />
          <Line type="monotone" dataKey="started" name="Started" dot={false} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LatencyChart({ data }: { data: any[] }) {
  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis dataKey="t" tickFormatter={formatTimeLabel} minTickGap={24} tick={{ fill: "var(--text)", fontSize: 12 }} />
          <YAxis tick={{ fill: "var(--text)", fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: "var(--text)" }} />
          <Line type="monotone" dataKey="avg2xxMs" name="Avg 2xx (ms)" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="avg4xxMs" name="Avg 4xx (ms)" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="avg5xxMs" name="Avg 5xx (ms)" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="avgAllMs" name="Avg All (ms)" dot={false} strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
