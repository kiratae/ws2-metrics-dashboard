export type RequestsTimeseriesPoint = {
  t: string;
  started: number;
  c2xx: number;
  c4xx: number;
  c5xx: number;
};

export type LatencyTimeseriesPoint = {
  t: string;
  avg2xxMs: number | null;
  avg4xxMs: number | null;
  avg5xxMs: number | null;
  avgAllMs: number | null;
};

export type RequestsTimeseriesResponse = {
  granularity: string;
  points: RequestsTimeseriesPoint[];
};

export type LatencyTimeseriesResponse = {
  granularity: string;
  points: LatencyTimeseriesPoint[];
};

export type Granularity = "auto" | "m5" | "hour" | "day";

function qparam(v: string | number | null | undefined) {
  if (v === null || v === undefined || v === "") return null;
  return String(v);
}

export function buildQuery(params: Record<string, string | number | null | undefined>) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    const s = qparam(v as any);
    if (s !== null) usp.set(k, s);
  }
  return usp.toString();
}

export async function fetchRequestsTimeseries(args: {
  apiBase: string;
  from: string;
  to: string;
  granularity: Granularity;
  companyId?: string;
  formTypeId?: string;
  signal?: AbortSignal;
}): Promise<RequestsTimeseriesResponse> {
  const qs = buildQuery({
    from: args.from,
    to: args.to,
    granularity: args.granularity,
    companyId: args.companyId ?? null,
    formTypeId: args.formTypeId ?? null,
  });
  const url = `${args.apiBase}/api/metrics/timeseries/requests?${qs}`;
  const res = await fetch(url, { signal: args.signal, cache: "no-store" });
  if (!res.ok) throw new Error(`requests endpoint failed: ${res.status}`);
  return res.json();
}

export async function fetchLatencyTimeseries(args: {
  apiBase: string;
  from: string;
  to: string;
  granularity: Granularity;
  companyId?: string;
  formTypeId?: string;
  signal?: AbortSignal;
}): Promise<LatencyTimeseriesResponse> {
  const qs = buildQuery({
    from: args.from,
    to: args.to,
    granularity: args.granularity,
    companyId: args.companyId ?? null,
    formTypeId: args.formTypeId ?? null,
  });
  const url = `${args.apiBase}/api/metrics/timeseries/latency?${qs}`;
  const res = await fetch(url, { signal: args.signal, cache: "no-store" });
  if (!res.ok) throw new Error(`latency endpoint failed: ${res.status}`);
  return res.json();
}
