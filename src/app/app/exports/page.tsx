"use client";

import { useEffect, useState } from "react";
import {
  addReceipt,
  AppConfig,
  DEFAULT_CONFIG,
  loadConfig,
} from "../lib/storage";
import { downloadJson } from "../lib/utils";
import { storeEpisodeSilently } from "../lib/memory";

type PeriodPreset = "this_quarter" | "last_quarter" | "custom";

type ExportResult = {
  status: "idle" | "success" | "error";
  message?: string;
  statusCode?: number;
  requestId?: string;
  requestPayload?: unknown;
  responsePayload?: unknown;
};

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

const getQuarterRange = (date: Date) => {
  const quarter = Math.floor(date.getMonth() / 3);
  const startMonth = quarter * 3;
  const start = new Date(date.getFullYear(), startMonth, 1);
  const end = new Date(date.getFullYear(), startMonth + 3, 0);
  return { start: toIsoDate(start), end: toIsoDate(end) };
};

const getLastQuarterRange = () => {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);
  const startMonth = quarter * 3 - 3;
  const year = startMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
  const normalizedMonth = (startMonth + 12) % 12;
  const start = new Date(year, normalizedMonth, 1);
  const end = new Date(year, normalizedMonth + 3, 0);
  return { start: toIsoDate(start), end: toIsoDate(end) };
};

export default function ExportsPage() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [preset, setPreset] = useState<PeriodPreset>("this_quarter");
  const [customStart, setCustomStart] = useState(toIsoDate(new Date()));
  const [customEnd, setCustomEnd] = useState(toIsoDate(new Date()));
  const [dryRun, setDryRun] = useState(true);
  const [result, setResult] = useState<ExportResult>({ status: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setConfig(loadConfig());
  }, []);

  const resolvePeriod = () => {
    if (preset === "this_quarter") {
      return getQuarterRange(new Date());
    }
    if (preset === "last_quarter") {
      return getLastQuarterRange();
    }
    return { start: customStart, end: customEnd };
  };

  const handleExport = async () => {
    setError(null);
    setResult({ status: "idle" });
    setShowDetails(false);

    const { start, end } = resolvePeriod();
    if (!start || !end) {
      setError("Bitte Zeitraum angeben.");
      return;
    }

    const requestPayload = {
      provider: "sevdesk",
      dry_run: dryRun,
      idempotency_key: `ui_export_${Date.now()}`,
      period_start: start,
      period_end: end,
      export_format: "json",
    };

    if (config.mode === "demo") {
      const demoRequestId = `demo_export_${Date.now()}`;
      const responsePayload = {
        ok: true,
        mode: "demo",
        request_id: demoRequestId,
        message: "Export bereit (Demo).",
        period_start: start,
        period_end: end,
      };
      setResult({
        status: "success",
        message: "Export erstellt (Demo).",
        requestId: demoRequestId,
        requestPayload,
        responsePayload,
      });
      addReceipt({
        ts: new Date().toISOString(),
        action: "period_export",
        status: "ok",
        requestId: demoRequestId,
      });
      downloadJson("export_summary.json", responsePayload);
      return;
    }

    if (!config.accessKey) {
      setError("Bitte Access Key in den Einstellungen hinterlegen.");
      return;
    }
    if (!config.gatewayBaseUrl) {
      setError("Bitte Gateway Base URL in den erweiterten Einstellungen setzen.");
      return;
    }

    setIsRunning(true);
    try {
      const response = await fetch(
        `${config.gatewayBaseUrl.replace(/\/$/, "")}/api/invoice/period_export`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.accessKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestPayload),
        },
      );

      const requestId = response.headers.get("x-gw-request-id") ?? undefined;
      const statusCode = response.status;
      const contentType = response.headers.get("content-type") ?? "";
      let responsePayload: unknown = null;
      if (contentType.includes("application/json")) {
        responsePayload = await response.json();
      } else {
        responsePayload = { raw_text: await response.text() };
      }

      setResult({
        status: response.ok ? "success" : "error",
        message: response.ok
          ? "Export erstellt."
          : "Export konnte nicht erstellt werden.",
        statusCode,
        requestId,
        requestPayload,
        responsePayload,
      });

      addReceipt({
        ts: new Date().toISOString(),
        action: "period_export",
        status: response.ok ? "ok" : "error",
        requestId,
      });

      if (response.ok) {
        await storeEpisodeSilently(
          config,
          "period_export",
          requestId,
          requestPayload,
          responsePayload,
          statusCode,
        );
      }
    } catch (fetchError) {
      setResult({
        status: "error",
        message: `Fehler beim Export: ${String(fetchError)}`,
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">
          Export fur Steuerberater
        </h1>
        <p className="text-sm text-slate-500">
          Quartals- oder Jahres-Export fur die Buchhaltung.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Zeitraum
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "this_quarter", label: "Dieses Quartal" },
              { id: "last_quarter", label: "Letztes Quartal" },
              { id: "custom", label: "Benutzerdefiniert" },
            ].map((option) => (
              <button
                key={option.id}
                className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
                  preset === option.id
                    ? "border-amber-300 bg-amber-50 text-amber-900"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
                type="button"
                onClick={() => setPreset(option.id as PeriodPreset)}
              >
                {option.label}
              </button>
            ))}
          </div>
          {preset === "custom" ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Start
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  type="date"
                  value={customStart}
                  onChange={(event) => setCustomStart(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Ende
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  type="date"
                  value={customEnd}
                  onChange={(event) => setCustomEnd(event.target.value)}
                />
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <input
              id="export-dry-run"
              type="checkbox"
              checked={dryRun}
              onChange={(event) => setDryRun(event.target.checked)}
            />
            <label
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
              htmlFor="export-dry-run"
            >
              Dry run
            </label>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
              {error}
            </div>
          ) : null}

          <button
            className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
            type="button"
            onClick={handleExport}
            disabled={isRunning}
          >
            {isRunning ? "Erstelle..." : "Export erstellen"}
          </button>
        </div>
      </div>

      {result.status !== "idle" ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div
            className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
              result.status === "success"
                ? "bg-emerald-50 text-emerald-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {result.message}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
              <div className="uppercase tracking-wide text-slate-400">
                Status
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {result.statusCode ?? "-"}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
              <div className="uppercase tracking-wide text-slate-400">
                Request ID
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {result.requestId ?? "-"}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
              <div className="uppercase tracking-wide text-slate-400">
                Export
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                Bereit
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900"
              type="button"
              onClick={() =>
                result.responsePayload
                  ? downloadJson("response.json", result.responsePayload)
                  : null
              }
              disabled={!result.responsePayload}
            >
              response.json
            </button>
            <button
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900"
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
            >
              {showDetails ? "Details ausblenden" : "Details anzeigen"}
            </button>
          </div>
          {showDetails ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-950/5 px-4 py-3 font-mono text-xs text-slate-900">
              <pre className="whitespace-pre-wrap break-words">
                {JSON.stringify(
                  {
                    request: result.requestPayload,
                    response: result.responsePayload,
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
