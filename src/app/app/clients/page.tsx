"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Client, loadClients, saveClients } from "../lib/storage";
import { formatCurrency } from "../lib/utils";

type ClientForm = {
  id?: string;
  name: string;
  email: string;
  defaultAmount: string;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState<ClientForm>({
    name: "",
    email: "",
    defaultAmount: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setClients(loadClients());
  }, []);

  const resetForm = () => {
    setForm({ name: "", email: "", defaultAmount: "" });
  };

  const handleSave = () => {
    setError(null);
    if (!form.name.trim() || !form.email.trim()) {
      setError("Bitte Name und E-Mail eingeben.");
      return;
    }
    const updated: Client = {
      id: form.id ?? `client_${Date.now()}`,
      name: form.name.trim(),
      email: form.email.trim(),
      defaultAmount: form.defaultAmount
        ? Number(form.defaultAmount)
        : undefined,
    };
    let next = clients;
    if (form.id) {
      next = clients.map((client) =>
        client.id === form.id ? updated : client,
      );
    } else {
      next = [updated, ...clients];
    }
    setClients(next);
    saveClients(next);
    resetForm();
  };

  const handleEdit = (client: Client) => {
    setForm({
      id: client.id,
      name: client.name,
      email: client.email,
      defaultAmount:
        client.defaultAmount !== undefined ? String(client.defaultAmount) : "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Klienten</h1>
        <p className="text-sm text-slate-500">
          Verwalten Sie Ihre Klienten fur schnelle Rechnungen.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {form.id ? "Klient bearbeiten" : "Neuer Klient"}
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            placeholder="Name"
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
          />
          <input
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            placeholder="E-Mail"
            value={form.email}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, email: event.target.value }))
            }
          />
          <input
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            placeholder="Standardbetrag (optional)"
            value={form.defaultAmount}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                defaultAmount: event.target.value,
              }))
            }
            type="number"
          />
        </div>
        {error ? (
          <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
            {error}
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-slate-800"
            type="button"
            onClick={handleSave}
          >
            Speichern
          </button>
          {form.id ? (
            <button
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900"
              type="button"
              onClick={resetForm}
            >
              Abbrechen
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Alle Klienten
        </h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">E-Mail</th>
                <th className="px-3 py-2">Standardbetrag</th>
                <th className="px-3 py-2">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {clients.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-slate-400" colSpan={4}>
                    Noch keine Klienten angelegt.
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id}>
                    <td className="px-3 py-2 text-slate-700">
                      {client.name}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {client.email}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {formatCurrency(client.defaultAmount)}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900"
                          type="button"
                          onClick={() => handleEdit(client)}
                        >
                          Bearbeiten
                        </button>
                        <Link
                          className="rounded-full bg-amber-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white hover:bg-amber-400"
                          href={`/app/invoice?clientId=${client.id}`}
                        >
                          Rechnung
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
