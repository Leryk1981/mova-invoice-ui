"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadReceipts, Receipt } from "./lib/storage";

export default function AppHomePage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [showReceipts, setShowReceipts] = useState(false);

  useEffect(() => {
    setReceipts(loadReceipts());
  }, []);

  const lastInvoice = receipts.find((entry) => entry.action === "create_send");

  return (
    <div className="space-y-8">
      <section className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            Heute nach der Sitzung
          </h1>
          <p className="text-sm text-slate-600">
            Schnell eine Rechnung senden oder den Export fur den Steuerberater
            erstellen.
          </p>
          <div className="grid gap-4">
            <Link
              className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-900 shadow-sm transition hover:border-amber-300"
              href="/app/invoice"
            >
              Neue Rechnung
              <span className="text-xs font-semibold uppercase tracking-wide">
                Jetzt
              </span>
            </Link>
            <Link
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"
              href="/app/exports"
            >
              Export fur Steuerberater
              <span className="text-xs font-semibold uppercase tracking-wide">
                Quartal/Jahr
              </span>
            </Link>
          </div>
        </div>
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Letzte Aktivitat
          </h2>
          {lastInvoice ? (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-slate-900">
                Letzte Rechnung: {new Date(lastInvoice.ts).toLocaleString()}
              </div>
              <div className="text-xs text-slate-500">
                Status: {lastInvoice.status === "ok" ? "✅" : "⚠️"}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Noch keine Aktivitat gespeichert.
            </p>
          )}
          <button
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900"
            type="button"
            onClick={() => setShowReceipts(true)}
          >
            Belege anzeigen
          </button>
        </div>
      </section>

      {showReceipts ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-6 py-8">
          <div className="w-full max-w-3xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Belege</h3>
              <button
                className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900"
                type="button"
                onClick={() => setShowReceipts(false)}
              >
                Schliessen
              </button>
            </div>
            <div className="max-h-[360px] overflow-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100 text-[10px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Zeit</th>
                    <th className="px-3 py-2">Aktion</th>
                    <th className="px-3 py-2">Klient</th>
                    <th className="px-3 py-2">Betrag</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Request ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {receipts.length === 0 ? (
                    <tr>
                      <td className="px-3 py-3 text-slate-400" colSpan={6}>
                        Keine Belege vorhanden.
                      </td>
                    </tr>
                  ) : (
                    receipts.map((receipt, index) => (
                      <tr key={`receipt-${index}`}>
                        <td className="px-3 py-2 text-slate-700">
                          {new Date(receipt.ts).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {receipt.action}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {receipt.clientName ?? "-"}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {receipt.amount ? `${receipt.amount} EUR` : "-"}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {receipt.status === "ok" ? "✅" : "⚠️"}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {receipt.requestId ?? "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
