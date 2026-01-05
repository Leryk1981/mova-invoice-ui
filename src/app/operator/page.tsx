"use client";

import { useEffect, useMemo, useState } from "react";
import createSendExample from "@/examples/invoice/create_send.json";
import markPaidExample from "@/examples/invoice/mark_paid.json";
import reminderScheduleExample from "@/examples/invoice/reminder_schedule.json";
import periodExportExample from "@/examples/invoice/period_export.json";

type Action = "create_send" | "reminder_schedule" | "mark_paid" | "period_export";

const DEFAULT_BASE_URL =
  "https://mova-tool-gateway-v0-dev.s-myasoedov81.workers.dev";
const TOKEN_STORAGE_KEY = "mova_gateway_token";

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
  const [action, setAction] = useState<Action>("create_send");
  const [payloadText, setPayloadText] = useState(() =>
    prettyPrint(EXAMPLES.create_send),
  );
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [requestBodyText, setRequestBodyText] = useState<string | null>(null);
  const [responseBodyText, setResponseBodyText] = useState<string | null>(null);
  const [responseIsJson, setResponseIsJson] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isTokenSaved, setIsTokenSaved] = useState(false);
  const tokenStored = useMemo(() => isTokenSaved, [isTokenSaved]);

  useEffect(() => {
    const storedToken =
      typeof window !== "undefined"
        ? window.localStorage.getItem(TOKEN_STORAGE_KEY)
        : null;
    if (storedToken) {
      setToken(storedToken);
      setIsTokenSaved(true);
    }
  }, []);

  const handleSaveToken = () => {
    if (!token.trim()) {
      setError("Token is empty. Provide a gateway token before saving.");
      return;
    }
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token.trim());
    setIsTokenSaved(true);
    setError(null);
  };

  const handleClearToken = () => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken("");
    setIsTokenSaved(false);
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
    setRequestId(null);
    setResponseBodyText(null);
    setResponseIsJson(false);

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
      setRequestId(response.headers.get("x-gw-request-id"));

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        try {
          const json = await response.json();
          const pretty = prettyPrint(json);
          setResponseBodyText(pretty);
          setResponseIsJson(true);
        } catch (jsonError) {
          const fallbackText = await response.text();
          setResponseBodyText(fallbackText);
          setError(`Response JSON parse failed: ${String(jsonError)}`);
        }
      } else {
        const text = await response.text();
        setResponseBodyText(text);
        setError("Response is not JSON. Displaying raw text.");
      }
    } catch (fetchError) {
      setError(`Request failed: ${String(fetchError)}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-12">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.28em] text-amber-800/70">
          Gateway-only operator tool
        </p>
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
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-slate-800"
              onClick={handleSaveToken}
              type="button"
            >
              Save token
            </button>
            <button
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900"
              onClick={handleClearToken}
              type="button"
            >
              Clear token
            </button>
            <span className="text-xs text-slate-500">
              Token stored locally: {tokenStored ? "yes" : "no"}
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
    </div>
  );
}
