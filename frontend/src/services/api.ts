import type {
  Calibration,
  Comparison,
  Consistency,
  DemoOptions,
  DemoRequest,
  DemoResult,
  Doc,
  DocSummary,
  DownloadItem,
  Experiments,
  Meta,
  Overview,
} from "./types";

/** Empty in dev: Vite proxies /api to the FastAPI server (see vite.config.ts). */
const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const TIMEOUT_MS = 30_000;

export class ApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

/** Absolute URL for backend-served files (figures, downloads). */
export const assetUrl = (path: string) => `${BASE_URL}${path}`;

async function request<T>(path: string, init: RequestInit = {}, signal?: AbortSignal): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(new DOMException("timeout", "TimeoutError")), TIMEOUT_MS);
  signal?.addEventListener("abort", () => ctrl.abort(signal.reason), { once: true });

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: { Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    if (ctrl.signal.aborted) throw new ApiError("The server took too long to respond.");
    throw new ApiError("Cannot reach the analysis server. Is the backend running on port 8000?");
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") detail = body.detail;
      else if (Array.isArray(body.detail)) detail = body.detail.map((d: { msg: string }) => d.msg).join("; ");
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(detail, res.status);
  }
  return res.json() as Promise<T>;
}

export const api = {
  meta: (s?: AbortSignal) => request<Meta>("/api/meta", {}, s),
  overview: (s?: AbortSignal) => request<Overview>("/api/overview", {}, s),
  demoOptions: (s?: AbortSignal) => request<DemoOptions>("/api/demo/options", {}, s),
  runDemo: (body: DemoRequest, s?: AbortSignal) =>
    request<DemoResult>("/api/demo/run", { method: "POST", body: JSON.stringify(body) }, s),
  comparison: (s?: AbortSignal) => request<Comparison>("/api/comparison", {}, s),
  calibration: (s?: AbortSignal) => request<Calibration>("/api/calibration", {}, s),
  consistency: (s?: AbortSignal) => request<Consistency>("/api/consistency", {}, s),
  experiments: (s?: AbortSignal) => request<Experiments>("/api/experiments", {}, s),
  docs: (s?: AbortSignal) => request<DocSummary[]>("/api/docs", {}, s),
  doc: (slug: string, s?: AbortSignal) => request<Doc>(`/api/docs/${encodeURIComponent(slug)}`, {}, s),
  downloads: (s?: AbortSignal) => request<DownloadItem[]>("/api/downloads", {}, s),
};
