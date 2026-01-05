"use client";

import { useEffect, useState } from "react";
import {
  AppConfig,
  DEFAULT_CONFIG,
  loadConfig,
  saveConfig,
} from "../lib/storage";

const DEV_GATEWAY_URL =
  "https://mova-tool-gateway-v0-dev.s-myasoedov81.workers.dev";

export default function SettingsPage() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setConfig(loadConfig());
  }, []);

  const handleModeChange = (mode: "demo" | "connected") => {
    const next = { ...config, mode };
    setConfig(next);
    saveConfig(next);
    setSaved(true);
  };

  const handleSave = () => {
    saveConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    const next: AppConfig = {
      ...config,
      accessKey: "",
      memoryToken: "",
    };
    setConfig(next);
    saveConfig(next);
    setSaved(true);
  };

  const handleUseDevDefaults = () => {
    const next: AppConfig = {
      ...config,
      gatewayBaseUrl: DEV_GATEWAY_URL,
      memoryBaseUrl: DEV_GATEWAY_URL,
    };
    setConfig(next);
    saveConfig(next);
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Einstellungen</h1>
        <p className="text-sm text-slate-500">
          Ruhige, sichere Konfiguration ohne Technik im Alltag.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Modus
        </h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
              config.mode === "demo"
                ? "border-amber-300 bg-amber-50 text-amber-900"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
            type="button"
            onClick={() => handleModeChange("demo")}
          >
            Demo
          </button>
          <button
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
              config.mode === "connected"
                ? "border-amber-300 bg-amber-50 text-amber-900"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
            type="button"
            onClick={() => handleModeChange("connected")}
          >
            Verbunden
          </button>
        </div>
        <div className="mt-4 space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Access key
          </label>
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none ring-amber-200 focus:ring-2"
            type="password"
            value={config.accessKey}
            onChange={(event) =>
              setConfig((prev) => ({ ...prev, accessKey: event.target.value }))
            }
            placeholder="Access key"
          />
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-slate-800"
              type="button"
              onClick={handleSave}
            >
              Speichern
            </button>
            <button
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900"
              type="button"
              onClick={handleClear}
            >
              Loschen
            </button>
            {saved ? (
              <span className="text-xs text-emerald-700">
                Gespeichert
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          Wir fragen keinen Banking-Zugriff ab.
        </div>
        <div className="mt-3 text-xs text-slate-500">
          Access key wird nur benotigt, um Anfragen an Ihr Gateway zu senden.
        </div>
      </div>

      <details className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">
          Advanced
        </summary>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Gateway Base URL
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none ring-amber-200 focus:ring-2"
              value={config.gatewayBaseUrl}
              onChange={(event) =>
                setConfig((prev) => ({
                  ...prev,
                  gatewayBaseUrl: event.target.value,
                }))
              }
              placeholder="https://gateway.example.workers.dev"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Memory Base URL
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none ring-amber-200 focus:ring-2"
              value={config.memoryBaseUrl}
              onChange={(event) =>
                setConfig((prev) => ({
                  ...prev,
                  memoryBaseUrl: event.target.value,
                }))
              }
              placeholder="Default to Gateway Base URL"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Memory token override
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none ring-amber-200 focus:ring-2"
              type="password"
              value={config.memoryToken}
              onChange={(event) =>
                setConfig((prev) => ({
                  ...prev,
                  memoryToken: event.target.value,
                }))
              }
              placeholder="Optional"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900"
              type="button"
              onClick={handleUseDevDefaults}
            >
              Use DEV defaults
            </button>
            <button
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-slate-800"
              type="button"
              onClick={handleSave}
            >
              Speichern
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}
