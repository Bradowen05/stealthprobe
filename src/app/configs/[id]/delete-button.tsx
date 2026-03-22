"use client";

import { useTransition } from "react";
import { deleteConfig } from "../actions";

export function DeleteConfigButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (!confirm(`Delete "${name}"? This will also delete all test runs.`))
          return;
        startTransition(() => deleteConfig(id));
      }}
      className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm transition-colors disabled:opacity-50"
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
