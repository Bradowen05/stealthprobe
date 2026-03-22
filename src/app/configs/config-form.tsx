"use client";

import { useActionState } from "react";

// Default Playwright config JSON for new configs
const DEFAULT_CONFIG = JSON.stringify(
  {
    headless: false,
    args: [],
    viewport: { width: 1920, height: 1080 },
    userAgent: "",
  },
  null,
  2
);

interface ConfigFormProps {
  action: (prevState: string | null, formData: FormData) => Promise<string | null>;
  initialData?: {
    name: string;
    description: string | null;
    configJson: unknown;
  };
  submitLabel: string;
}

export function ConfigForm({
  action,
  initialData,
  submitLabel,
}: ConfigFormProps) {
  const [error, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-400/10 border border-red-400/20 text-red-400 px-4 py-3 rounded-lg text-sm">
          {String(error)}
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-zinc-300 mb-1"
        >
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={initialData?.name ?? ""}
          placeholder='e.g. "Stealth Advanced"'
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 placeholder:text-zinc-600"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-zinc-300 mb-1"
        >
          Description{" "}
          <span className="text-zinc-600 font-normal">(optional)</span>
        </label>
        <input
          id="description"
          name="description"
          type="text"
          defaultValue={initialData?.description ?? ""}
          placeholder="What makes this config special?"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 placeholder:text-zinc-600"
        />
      </div>

      <div>
        <label
          htmlFor="configJson"
          className="block text-sm font-medium text-zinc-300 mb-1"
        >
          Playwright Config JSON
        </label>
        <textarea
          id="configJson"
          name="configJson"
          required
          rows={12}
          defaultValue={
            initialData
              ? JSON.stringify(initialData.configJson, null, 2)
              : DEFAULT_CONFIG
          }
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-emerald-500"
        />
        <p className="text-xs text-zinc-600 mt-1">
          Playwright launch options: headless, args, viewport, userAgent, etc.
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-medium rounded-lg text-sm transition-colors"
      >
        {isPending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
