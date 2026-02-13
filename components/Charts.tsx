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

export type ChartGranularity = "5m" | "hour" | "day" | string;

const fmtTime = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" });
const fmtDate = new Intl.DateTimeFormat(undefined, { month: "short", day: "2-digit" });
const fmtDateTime = new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });

function parseLocal(iso: string) {
  // API returns local-ish ISO without timezone; JS parses as local in most browsers.
  return new Date(iso);
}

function formatAxisLabel(iso: string, granularity: ChartGranularity) {
  const d = parseLocal(iso);
  if (granularity === "day") return fmtDate.format(d);
  if (granularity === "hour") return `${fmtDate.format(d)} ${String(d.getHours()).padStart(2, "0")}:00`;
  // 5m / default
  return fmtTime.format(d);
}

function formatTooltipTitle(iso: string, granularity: ChartGranularity) {
  const d = parseLocal(iso);
  if (granularity === "day") return fmtDateTime.format(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0));
  return fmtDateTime.format(d);
}

function makeCustomTooltip(granularity: ChartGranularity) {
  return function CustomTooltip({ active, label, payload }: any) {
    if (!active || !payload || !payload.length) return null;

    const items = payload
      .filter((p: any) => p && typeof p.value === "number")
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

    const title = label ? formatTooltipTitle(String(label), granularity) : "";

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
  };
}

export function RequestsChart({ data, granularity }: { data: any[]; granularity: ChartGranularity }) {
  const CustomTooltip = React.useMemo(() => makeCustomTooltip(granularity), [granularity]);

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis
            dataKey="t"
            tickFormatter={(v) => formatAxisLabel(String(v), granularity)}
            minTickGap={24}
            tick={{ fill: "var(--text)", fontSize: 12 }}
          />
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

export function LatencyChart({ data, granularity }: { data: any[]; granularity: ChartGranularity }) {
  const CustomTooltip = React.useMemo(() => makeCustomTooltip(granularity), [granularity]);

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis
            dataKey="t"
            tickFormatter={(v) => formatAxisLabel(String(v), granularity)}
            minTickGap={24}
            tick={{ fill: "var(--text)", fontSize: 12 }}
          />
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
