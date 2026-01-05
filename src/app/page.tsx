import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-16">
      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-800/70">
          Operator tooling
        </p>
        <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
          MOVA Invoice Operator Console
        </h1>
        <p className="max-w-2xl text-base leading-7 text-slate-600">
          Minimal UI for running invoice actions through the gateway and
          capturing deterministic outputs with request metadata.
        </p>
      </header>

      <section className="grid gap-6 rounded-3xl border border-amber-100 bg-white/70 p-8 shadow-sm backdrop-blur sm:grid-cols-[1.3fr_1fr]">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">
            Open the operator console
          </h2>
          <p className="text-sm leading-6 text-slate-600">
            Use the gateway token stored in this browser to execute dry-run or
            live invoice actions.
          </p>
        </div>
        <div className="flex items-center justify-start sm:justify-end">
          <Link
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800"
            href="/operator"
          >
            Launch /operator
          </Link>
        </div>
      </section>
    </div>
  );
}
