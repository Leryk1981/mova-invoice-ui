"use client";

import { useEffect, useMemo, useState } from "react";
import createSendExample from "@/examples/invoice/create_send.json";
import markPaidExample from "@/examples/invoice/mark_paid.json";
import reminderScheduleExample from "@/examples/invoice/reminder_schedule.json";
import periodExportExample from "@/examples/invoice/period_export.json";

type Action = "create_send" | "reminder_schedule" | "mark_paid" | "period_export";

const DEFAULT_BASE_URL =
  "https://mova-tool-gateway-v0-dev.s-myasoedov81.workers.dev";
const GATEWAY_BASE_URL_KEY = "mova_gateway_base_url";
const GATEWAY_TOKEN_KEY = "mova_gateway_token";
const MEMORY_BASE_URL_KEY = "mova_memory_base_url";
const MEMORY_TOKEN_KEY = "mova_memory_token";

const ACTIONS: { value: Action; label: string }[] = [
  { value: "create_send", label: "create_send" },
  { value: "reminder_schedule", label: "reminder_schedule" },
  { value: "mark_paid", label: "mark_paid" },
  { value: "period_export", label: "period_export" },
];

const EXAMPLES: Record<Action, unknown> = {
  create_send: createSendExample,
  reminder_schedule: reminderScheduleExample,
  mark_paid: markPaidExample,
  period_export: periodExportExample,
};

const prettyPrint = (value: unknown) => JSON.stringify(value, null, 2);

const truncateText = (value: string, maxLength = 2000) =>
  value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;

const downloadText = (filename: string, text: string, type: string) => {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export default function OperatorPage() {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [token, setToken] = useState("");
  const [memoryBaseUrl, setMemoryBaseUrl] = useState(DEFAULT_BASE_URL);
  const [memoryToken, setMemoryToken] = useState("");
  const [action, setAction] = useState<Action>("create_send");
  const [payloadText, setPayloadText] = useState(() =>
    prettyPrint(EXAMPLES.create_send),
  );
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [lastRunOk, setLastRunOk] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [requestBodyText, setRequestBodyText] = useState<string | null>(null);
  const [responseBodyText, setResponseBodyText] = useState<string | null>(null);
  const [responseIsJson, setResponseIsJson] = useState(false);
  const [lastRequestPayload, setLastRequestPayload] = useState<unknown | null>(
    null,
  );
  const [lastResponsePayload, setLastResponsePayload] = useState<unknown | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isTokenSaved, setIsTokenSaved] = useState(false);
  const [isMemoryTokenSaved, setIsMemoryTokenSaved] = useState(false);
  const [storeStatusCode, setStoreStatusCode] = useState<number | null>(null);
  const [storeResponseText, setStoreResponseText] = useState<string | null>(null);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [searchStatusCode, setSearchStatusCode] = useState<number | null>(null);
  const [searchResponseText, setSearchResponseText] = useState<string | null>(
    null,
  );
  const [searchError, setSearchError] = useState<string | null>(null);
  const [episodes, setEpisodes] = useState<unknown[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<unknown | null>(null);
  const tokenStored = useMemo(() => isTokenSaved, [isTokenSaved]);
  const memoryTokenStored = useMemo(
    () => isMemoryTokenSaved,
    [isMemoryTokenSaved],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const storedBaseUrl = window.localStorage.getItem(GATEWAY_BASE_URL_KEY);
    const storedToken = window.localStorage.getItem(GATEWAY_TOKEN_KEY);
    const storedMemoryBaseUrl = window.localStorage.getItem(MEMORY_BASE_URL_KEY);
    const storedMemoryToken = window.localStorage.getItem(MEMORY_TOKEN_KEY);

    if (storedBaseUrl) {
      setBaseUrl(storedBaseUrl);
    }
    if (storedToken) {
      setToken(storedToken);
      setIsTokenSaved(true);
    }
    if (storedMemoryBaseUrl) {
      setMemoryBaseUrl(storedMemoryBaseUrl);
    } else if (storedBaseUrl) {
      setMemoryBaseUrl(storedBaseUrl);
    }
    if (storedMemoryToken) {
      setMemoryToken(storedMemoryToken);
      setIsMemoryTokenSaved(true);
    } else if (storedToken) {
      setMemoryToken(storedToken);
    }
  }, []);

  const handleSaveToken = () => {
    if (!baseUrl.trim()) {
      setError("Gateway base URL is required before saving.");
      return;
    }
    window.localStorage.setItem(GATEWAY_BASE_URL_KEY, baseUrl.trim());
    if (token.trim()) {
      window.localStorage.setItem(GATEWAY_TOKEN_KEY, token.trim());
      setIsTokenSaved(true);
    } else {
      window.localStorage.removeItem(GATEWAY_TOKEN_KEY);
      setIsTokenSaved(false);
    }
    if (memoryBaseUrl.trim()) {
      window.localStorage.setItem(MEMORY_BASE_URL_KEY, memoryBaseUrl.trim());
    }
    if (memoryToken.trim()) {
      window.localStorage.setItem(MEMORY_TOKEN_KEY, memoryToken.trim());
      setIsMemoryTokenSaved(true);
    } else {
      window.localStorage.removeItem(MEMORY_TOKEN_KEY);
      setIsMemoryTokenSaved(false);
    }
    setError(null);
  };

  const handleUseDevDefaults = () => {
    setBaseUrl(DEFAULT_BASE_URL);
    setMemoryBaseUrl(DEFAULT_BASE_URL);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(GATEWAY_BASE_URL_KEY, DEFAULT_BASE_URL);
      window.localStorage.setItem(MEMORY_BASE_URL_KEY, DEFAULT_BASE_URL);
    }
  };

  const handleClearToken = () => {
    window.localStorage.removeItem(GATEWAY_TOKEN_KEY);
    window.localStorage.removeItem(MEMORY_TOKEN_KEY);
    setToken("");
    setMemoryToken("");
    setIsTokenSaved(false);
    setIsMemoryTokenSaved(false);
  };

  const handleLoadExample = () => {
    setPayloadText(prettyPrint(EXAMPLES[action]));
    setError(null);
  };

  const handleCopyResponse = async () => {
    if (!responseBodyText) {
      return;
    }
    try {
      await navigator.clipboard.writeText(responseBodyText);
    } catch (copyError) {
      setError(`Copy failed: ${String(copyError)}`);
    }
  };

  const handleRun = async () => {
    setError(null);
    setStatusCode(null);
    setLastRunOk(false);
    setRequestId(null);
    setResponseBodyText(null);
    setResponseIsJson(false);
    setLastRequestPayload(null);
    setLastResponsePayload(null);

    if (!baseUrl.trim()) {
      setError("Gateway base URL is required.");
      return;
    }
    if (!token.trim()) {
      setError("Gateway token is required.");
      return;
    }

    let parsedPayload: unknown;
    try {
      parsedPayload = JSON.parse(payloadText);
    } catch (parseError) {
      setError(`Invalid JSON payload: ${String(parseError)}`);
      return;
    }

    const requestBody = JSON.stringify(parsedPayload);
    setRequestBodyText(prettyPrint(parsedPayload));
    setLastRequestPayload(parsedPayload);

    setIsRunning(true);
    try {
      const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
      const response = await fetch(
        `${normalizedBaseUrl}/api/invoice/${action}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token.trim()}`,
            "Content-Type": "application/json",
          },
          body: requestBody,
        },
      );

      setStatusCode(response.status);
      setLastRunOk(response.ok);
      setRequestId(response.headers.get("x-gw-request-id"));

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        try {
          const json = await response.json();
          const pretty = prettyPrint(json);
          setResponseBodyText(pretty);
          setResponseIsJson(true);
          setLastResponsePayload(json);
        } catch (jsonError) {
          const fallbackText = await response.text();
          setResponseBodyText(fallbackText);
          setLastResponsePayload({
            raw_text: truncateText(fallbackText),
          });
          setError(`Response JSON parse failed: ${String(jsonError)}`);
        }
      } else {
        const text = await response.text();
        setResponseBodyText(text);
        setLastResponsePayload({
          raw_text: truncateText(text),
        });
        setError("Response is not JSON. Displaying raw text.");
      }
    } catch (fetchError) {
      setError(`Request failed: ${String(fetchError)}`);
    } finally {
      setIsRunning(false);
    }
  };

  const effectiveMemoryBaseUrl = memoryBaseUrl.trim() || baseUrl.trim();
  const effectiveMemoryToken = memoryToken.trim() || token.trim();
  const canStoreEpisode =
    lastRunOk && Boolean(lastRequestPayload) && Boolean(lastResponsePayload);

  const buildEpisodePayload = () => {
    if (!lastRequestPayload || !lastResponsePayload) {
      return null;
    }
    const shortRand = Math.random().toString(36).slice(2, 8);
    const requestObject =
      typeof lastRequestPayload === "object" && lastRequestPayload !== null
        ? (lastRequestPayload as Record<string, unknown>)
        : null;
    const dryRun =
      requestObject && typeof requestObject.dry_run === "boolean"
        ? requestObject.dry_run
        : undefined;
    const provider =
      requestObject && typeof requestObject.provider === "string"
        ? requestObject.provider
        : undefined;

    return {
      episode_id: `ui_${Date.now()}_${shortRand}`,
      domain: "invoice",
      action,
      ts_iso: new Date().toISOString(),
      gw_request_id: requestId ?? undefined,
      inputs: {
        request: lastRequestPayload,
      },
      outputs: {
        http_status: statusCode ?? undefined,
        response: lastResponsePayload,
      },
      meta: {
        source: "mova-invoice-ui/operator",
        dry_run: dryRun,
        provider,
      },
    };
  };

  const handleStoreEpisode = async () => {
    setStoreError(null);
    setStoreStatusCode(null);
    setStoreResponseText(null);

    if (!effectiveMemoryBaseUrl) {
      setStoreError("Memory base URL is required.");
      return;
    }
    if (!effectiveMemoryToken) {
      setStoreError("Memory token is required.");
      return;
    }

    const payload = buildEpisodePayload();
    if (!payload) {
      setStoreError("Run an action successfully before storing an episode.");
      return;
    }

    try {
      const response = await fetch(
        `${effectiveMemoryBaseUrl.replace(/\/$/, "")}/episode/store`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${effectiveMemoryToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      setStoreStatusCode(response.status);
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        try {
          const json = await response.json();
          setStoreResponseText(prettyPrint(json));
        } catch (jsonError) {
          const text = await response.text();
          setStoreResponseText(text);
          setStoreError(`Store JSON parse failed: ${String(jsonError)}`);
        }
      } else {
        const text = await response.text();
        setStoreResponseText(text);
        setStoreError("Store response is not JSON. Displaying raw text.");
      }
    } catch (fetchError) {
      setStoreError(`Store request failed: ${String(fetchError)}`);
    }
  };

  const extractEpisodeItems = (payload: unknown) => {
    if (Array.isArray(payload)) {
      return payload;
    }
    if (payload && typeof payload === "object") {
      const obj = payload as Record<string, unknown>;
      const items = obj.items ?? obj.episodes ?? obj.data ?? obj.results;
      if (Array.isArray(items)) {
        return items;
      }
    }
    return [];
  };

  const handleRefreshEpisodes = async () => {
    setSearchError(null);
    setSearchStatusCode(null);
    setSearchResponseText(null);
    setEpisodes([]);

    if (!effectiveMemoryBaseUrl) {
      setSearchError("Memory base URL is required.");
      return;
    }
    if (!effectiveMemoryToken) {
      setSearchError("Memory token is required.");
      return;
    }

    try {
      const response = await fetch(
        `${effectiveMemoryBaseUrl.replace(/\/$/, "")}/episode/search`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${effectiveMemoryToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            domain: "invoice",
            limit: 10,
            order: "desc",
          }),
        },
      );

      setSearchStatusCode(response.status);
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        try {
          const json = await response.json();
          setSearchResponseText(prettyPrint(json));
          setEpisodes(extractEpisodeItems(json));
        } catch (jsonError) {
          const text = await response.text();
          setSearchResponseText(text);
          setSearchError(`Search JSON parse failed: ${String(jsonError)}`);
        }
      } else {
        const text = await response.text();
        setSearchResponseText(text);
        setSearchError("Search response is not JSON. Displaying raw text.");
      }
    } catch (fetchError) {
      setSearchError(`Search request failed: ${String(fetchError)}`);
    }
  };

  const getEpisodeValue = (episode: unknown, keys: string[]) => {
    if (!episode || typeof episode !== "object") {
      return undefined;
    }
    const obj = episode as Record<string, unknown>;
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null) {
        return obj[key];
      }
    }
    return undefined;
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-12">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs uppercase tracking-[0.28em] text-amber-800/70">
            Advanced / Operator
          </span>
          <a
            className="text-xs font-semibold uppercase tracking-wide text-slate-600 hover:text-slate-900"
            href="/app"
          >
            Zuruck zur App
          </a>
        </div>
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
          MOVA Invoice Operator Console
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          Run invoice actions via the gateway, capture deterministic outputs, and
          archive the request/response metadata.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-4 rounded-2xl border border-amber-100 bg-white/80 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Connection</h2>
          <div className="space-y-3">
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
              Gateway base URL
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none ring-amber-200 focus:ring-2"
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              placeholder="https://gateway.example.workers.dev"
            />
            <button
              className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900"
              onClick={handleUseDevDefaults}
              type="button"
            >
              Use DEV defaults
            </button>
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
              Gateway token
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none ring-amber-200 focus:ring-2"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Bearer token"
              type="password"
            />
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
              Memory base URL
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none ring-amber-200 focus:ring-2"
              value={memoryBaseUrl}
              onChange={(event) => setMemoryBaseUrl(event.target.value)}
              placeholder="Defaults to gateway base URL"
            />
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
              Memory token
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none ring-amber-200 focus:ring-2"
              value={memoryToken}
              onChange={(event) => setMemoryToken(event.target.value)}
              placeholder="Defaults to gateway token"
              type="password"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-slate-800"
              onClick={handleSaveToken}
              type="button"
            >
              Save settings
            </button>
            <button
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900"
              onClick={handleClearToken}
              type="button"
            >
              Clear tokens
            </button>
            <span className="text-xs text-slate-500">
              Gateway token stored: {tokenStored ? "yes" : "no"}
            </span>
            <span className="text-xs text-slate-500">
              Memory token stored: {memoryTokenStored ? "yes" : "no"}
            </span>
          </div>
          <div className="rounded-xl border border-amber-200/60 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            Safety note: token is stored locally in this browser only. Do not
            use on shared machines.
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Action</h2>
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-2">
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Invoice action
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none ring-amber-200 focus:ring-2"
                value={action}
                onChange={(event) =>
                  setAction(event.target.value as Action)
                }
              >
                {ACTIONS.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="h-10 rounded-full border border-slate-200 px-4 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900"
              onClick={handleLoadExample}
              type="button"
            >
              Load example
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
              Request JSON
            </label>
            <textarea
              className="min-h-[240px] w-full rounded-2xl border border-slate-200 bg-slate-950/5 px-4 py-3 font-mono text-xs text-slate-900 outline-none ring-amber-200 focus:ring-2"
              value={payloadText}
              onChange={(event) => setPayloadText(event.target.value)}
              spellCheck={false}
            />
          </div>

          <button
            className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
            onClick={handleRun}
            type="button"
            disabled={isRunning}
          >
            {isRunning ? "Running..." : "Run action"}
          </button>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Result</h2>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Status
            </div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {statusCode ?? "-"}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              x-gw-request-id
            </div>
            <div className="mt-1 text-sm font-medium text-slate-900">
              {requestId ?? "-"}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900 disabled:opacity-40"
              onClick={handleCopyResponse}
              type="button"
              disabled={!responseBodyText}
            >
              Copy JSON
            </button>
            <button
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900 disabled:opacity-40"
              onClick={() =>
                responseBodyText
                  ? downloadText(
                      "response.json",
                      responseBodyText,
                      responseIsJson ? "application/json" : "text/plain",
                    )
                  : null
              }
              type="button"
              disabled={!responseBodyText}
            >
              Download response.json
            </button>
            <button
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900 disabled:opacity-40"
              onClick={() =>
                requestBodyText
                  ? downloadText(
                      "request.json",
                      requestBodyText,
                      "application/json",
                    )
                  : null
              }
              type="button"
              disabled={!requestBodyText}
            >
              Download request.json
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-950/5 px-4 py-3 font-mono text-xs text-slate-900">
            <pre className="whitespace-pre-wrap break-words">
              {responseBodyText ?? "No response yet."}
            </pre>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
            {error}
          </div>
        ) : null}
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Episodes</h2>
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-3 rounded-2xl border border-amber-100 bg-white px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  Store episode
                </div>
                <p className="text-xs text-slate-500">
                  Requires a successful run.
                </p>
              </div>
              <button
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleStoreEpisode}
                type="button"
                disabled={!canStoreEpisode}
              >
                Store
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                <div className="uppercase tracking-wide text-slate-400">
                  Status
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {storeStatusCode ?? "-"}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                <div className="uppercase tracking-wide text-slate-400">
                  Memory base
                </div>
                <div className="mt-1 text-xs font-medium text-slate-900">
                  {effectiveMemoryBaseUrl || "-"}
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-950/5 px-3 py-2 font-mono text-xs text-slate-900">
              <pre className="whitespace-pre-wrap break-words">
                {storeResponseText ?? "No store response yet."}
              </pre>
            </div>
            {storeError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                {storeError}
              </div>
            ) : null}
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  Recent episodes
                </div>
                <p className="text-xs text-slate-500">
                  Domain filter: invoice
                </p>
              </div>
              <button
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900"
                onClick={handleRefreshEpisodes}
                type="button"
              >
                Refresh
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                <div className="uppercase tracking-wide text-slate-400">
                  Status
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {searchStatusCode ?? "-"}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                <div className="uppercase tracking-wide text-slate-400">
                  Results
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {episodes.length}
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-950/5 px-3 py-2 font-mono text-xs text-slate-900">
              <pre className="whitespace-pre-wrap break-words">
                {searchResponseText ?? "No search response yet."}
              </pre>
            </div>
            {searchError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                {searchError}
              </div>
            ) : null}
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Episode ID</th>
                <th className="px-3 py-2">Request ID</th>
                <th className="px-3 py-2">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {episodes.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-slate-400" colSpan={6}>
                    No episodes loaded yet.
                  </td>
                </tr>
              ) : (
                episodes.map((episode, index) => {
                  const time = getEpisodeValue(episode, [
                    "created_at",
                    "ts_iso",
                    "time",
                  ]);
                  const actionValue = getEpisodeValue(episode, ["action"]);
                  const statusValue = getEpisodeValue(episode, [
                    "status",
                    "http_status",
                  ]);
                  const episodeId = getEpisodeValue(episode, [
                    "episode_id",
                    "id",
                  ]);
                  const reqId = getEpisodeValue(episode, [
                    "gw_request_id",
                    "request_id",
                    "x_gw_request_id",
                  ]);
                  return (
                    <tr key={`episode-${index}`}>
                      <td className="px-3 py-2 text-slate-700">
                        {typeof time === "string" || typeof time === "number"
                          ? String(time)
                          : "-"}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {typeof actionValue === "string"
                          ? actionValue
                          : "-"}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {typeof statusValue === "string" ||
                        typeof statusValue === "number"
                          ? String(statusValue)
                          : "-"}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {typeof episodeId === "string" ||
                        typeof episodeId === "number"
                          ? String(episodeId)
                          : "-"}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {typeof reqId === "string" || typeof reqId === "number"
                          ? String(reqId)
                          : "-"}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900"
                          type="button"
                          onClick={() => setSelectedEpisode(episode)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedEpisode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-6 py-8">
          <div className="w-full max-w-3xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Episode details
              </h3>
              <button
                className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900"
                type="button"
                onClick={() => setSelectedEpisode(null)}
              >
                Close
              </button>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-950/5 px-4 py-3 font-mono text-xs text-slate-900">
              <pre className="whitespace-pre-wrap break-words">
                {prettyPrint(selectedEpisode)}
              </pre>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
