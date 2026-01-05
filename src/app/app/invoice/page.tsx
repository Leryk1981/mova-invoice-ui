"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addReceipt,
  AppConfig,
  Client,
  DEFAULT_CONFIG,
  loadClients,
  loadConfig,
  saveClients,
} from "../lib/storage";
import { storeEpisodeSilently } from "../lib/memory";
import { downloadJson, formatCurrency } from "../lib/utils";

type ResultState = {
  status: "idle" | "success" | "error";
  message?: string;
  statusCode?: number;
  requestId?: string;
  requestPayload?: unknown;
  responsePayload?: unknown;
};

const presetAmounts = [60, 90, 120];

const buildRequestPayload = (
  client: Client,
  amount: number,
  dueDate: string,
  dryRun: boolean,
  note: string,
) => {
  return {
    provider: "sevdesk",
    dry_run: dryRun,
    idempotency_key: `ui_${Date.now()}`,
    customer_id: client.id,
    invoice_data: {
      invoice_number: `INV-${dueDate}`,
      amount,
      currency: "EUR",
      due_date: dueDate,
      items: [
        {
          description: note.trim() || "Therapie Sitzung",
          quantity: 1,
          unit_price: amount,
        },
      ],
    },
  };
};


export default function InvoicePage() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    defaultAmount: "",
  });
  const [dryRun, setDryRun] = useState(true);
  const [dueDate, setDueDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultState>({ status: "idle" });
  const [showDetails, setShowDetails] = useState(false);
  const [savedLocally, setSavedLocally] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setConfig(loadConfig());
    const storedClients = loadClients();
    setClients(storedClients);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const clientId = params.get("clientId");
    if (clientId) {
      setSelectedClientId(clientId);
    }
  }, []);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId),
    [clients, selectedClientId],
  );

  const availablePresets = useMemo(() => {
    const presets = new Set<number>(presetAmounts);
    if (selectedClient?.defaultAmount) {
      presets.add(selectedClient.defaultAmount);
    }
    return Array.from(presets).sort((a, b) => a - b);
  }, [selectedClient]);

  const handleSaveClient = () => {
    setError(null);
    if (!newClient.name.trim() || !newClient.email.trim()) {
      setError("Bitte Name und E-Mail fur den Klienten eingeben.");
      return;
    }
    const created: Client = {
      id: `client_${Date.now()}`,
      name: newClient.name.trim(),
      email: newClient.email.trim(),
      defaultAmount: newClient.defaultAmount
        ? Number(newClient.defaultAmount)
        : undefined,
    };
    const updated = [created, ...clients];
    setClients(updated);
    saveClients(updated);
    setSelectedClientId(created.id);
    setShowNewClient(false);
    setNewClient({ name: "", email: "", defaultAmount: "" });
  };

  const handleSend = async () => {
    setError(null);
    setResult({ status: "idle" });
    setShowDetails(false);
    setSavedLocally(false);

    if (!selectedClient) {
      setError("Bitte zuerst einen Klienten auswahlen.");
      return;
    }
    if (!amount || Number.isNaN(amount) || amount <= 0) {
      setError("Bitte einen Betrag eingeben.");
      return;
    }

    const requestPayload = buildRequestPayload(
      selectedClient,
      amount,
      dueDate,
      dryRun,
      note,
    );

    if (config.mode === "demo") {
      const demoRequestId = `demo_${Date.now()}`;
      const responsePayload = {
        ok: true,
        mode: "demo",
        request_id: demoRequestId,
        message: "Rechnung wurde im Demo-Modus erstellt.",
      };
      setResult({
        status: "success",
        message: "Rechnung gesendet (Demo).",
        requestId: demoRequestId,
        requestPayload,
        responsePayload,
      });
      addReceipt({
        ts: new Date().toISOString(),
        action: "create_send",
        status: "ok",
        requestId: demoRequestId,
        clientName: selectedClient.name,
        amount,
      });
      setSavedLocally(true);
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

    setIsSending(true);
    try {
      const response = await fetch(
        `${config.gatewayBaseUrl.replace(/\/$/, "")}/api/invoice/create_send`,
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
          ? "Rechnung gesendet."
          : "Rechnung konnte nicht gesendet werden.",
        statusCode,
        requestId,
        requestPayload,
        responsePayload,
      });

      addReceipt({
        ts: new Date().toISOString(),
        action: "create_send",
        status: response.ok ? "ok" : "error",
        requestId,
        clientName: selectedClient.name,
        amount,
      });
      setSavedLocally(true);

      if (response.ok) {
        await storeEpisodeSilently(
          config,
          "create_send",
          requestId,
          requestPayload,
          responsePayload,
          statusCode,
        );
      }
    } catch (fetchError) {
      setResult({
        status: "error",
        message: `Fehler beim Senden: ${String(fetchError)}`,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleStoreReceipt = () => {
    if (!selectedClient || !amount) {
      return;
    }
    addReceipt({
      ts: new Date().toISOString(),
      action: "create_send",
      status: result.status === "success" ? "ok" : "error",
      requestId: result.requestId,
      clientName: selectedClient.name,
      amount,
    });
    setSavedLocally(true);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Neue Rechnung
            </h1>
            <p className="text-sm text-slate-500">
              Schnell und ohne Technik.
            </p>
          </div>
          <span className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Modus: {config.mode === "demo" ? "Demo" : "Verbunden"}
          </span>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Schritt 1 — Klient
            </h2>
            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Auswahl
                </label>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none ring-amber-200 focus:ring-2"
                  value={selectedClientId}
                  onChange={(event) => setSelectedClientId(event.target.value)}
                >
                  <option value="">Bitte auswahlen</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.email})
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="h-10 rounded-full border border-slate-200 px-4 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900"
                type="button"
                onClick={() => setShowNewClient((prev) => !prev)}
              >
                Neuer Klient
              </button>
            </div>
            {showNewClient ? (
              <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 md:grid-cols-3">
                <input
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  placeholder="Name"
                  value={newClient.name}
                  onChange={(event) =>
                    setNewClient((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                />
                <input
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  placeholder="E-Mail"
                  value={newClient.email}
                  onChange={(event) =>
                    setNewClient((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                />
                <input
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  placeholder="Standardbetrag (optional)"
                  value={newClient.defaultAmount}
                  onChange={(event) =>
                    setNewClient((prev) => ({
                      ...prev,
                      defaultAmount: event.target.value,
                    }))
                  }
                  type="number"
                />
                <div className="md:col-span-3">
                  <button
                    className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-slate-800"
                    type="button"
                    onClick={handleSaveClient}
                  >
                    Speichern
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Schritt 2 — Betrag
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {availablePresets.map((preset) => (
                <button
                  key={`preset-${preset}`}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
                    amount === preset
                      ? "border-amber-300 bg-amber-50 text-amber-900"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                  type="button"
                  onClick={() => setAmount(preset)}
                >
                  {formatCurrency(preset)}
                </button>
              ))}
              <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Anderer Betrag
                </span>
                <input
                  className="w-24 border-none bg-transparent text-sm text-slate-900 outline-none"
                  placeholder="0"
                  type="number"
                  value={amount ?? ""}
                  onChange={(event) => setAmount(Number(event.target.value))}
                />
              </div>
            </div>
          </div>

          <details className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500">
              Optionale Details
            </summary>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Datum
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Notiz
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  placeholder="Optional"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="dry-run"
                  type="checkbox"
                  checked={dryRun}
                  onChange={(event) => setDryRun(event.target.checked)}
                />
                <label
                  className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                  htmlFor="dry-run"
                >
                  Dry run
                </label>
              </div>
            </div>
          </details>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
              {error}
            </div>
          ) : null}

          <button
            className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
            type="button"
            onClick={handleSend}
            disabled={isSending}
          >
            {isSending ? "Sende..." : "Rechnung senden"}
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
                Beleg
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {savedLocally ? "Gespeichert" : "Lokal"}
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={handleStoreReceipt}
              disabled={savedLocally}
            >
              Beleg speichern
            </button>
            <button
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900"
              type="button"
              onClick={() =>
                result.requestPayload
                  ? downloadJson("request.json", result.requestPayload)
                  : null
              }
              disabled={!result.requestPayload}
            >
              request.json
            </button>
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
            <a
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-slate-800"
              href="/app"
            >
              Zuruck zu Heute
            </a>
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
