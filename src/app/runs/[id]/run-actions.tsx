"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReRunButton({ configId }: { configId: string }) {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);

  async function handleReRun() {
    setIsRunning(true);
    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configId }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/runs/${data.testRunId}`);
      }
    } catch {
      // Ignore
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <button
      onClick={handleReRun}
      disabled={isRunning}
      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-medium rounded-lg text-sm transition-colors disabled:opacity-50"
    >
      {isRunning ? "Starting..." : "Re-run"}
    </button>
  );
}

export function ExportButton({ runId }: { runId: string }) {
  return (
    <a
      href={`/api/runs/${runId}/export`}
      download
      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors inline-block"
    >
      Export JSON
    </a>
  );
}
