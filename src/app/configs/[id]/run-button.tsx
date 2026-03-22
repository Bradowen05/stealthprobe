"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RunTestButton({ configId }: { configId: string }) {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);

  async function handleRun() {
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
      } else {
        alert(data.error || "Failed to start test run");
      }
    } catch {
      alert("Failed to start test run");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <button
      onClick={handleRun}
      disabled={isRunning}
      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-medium rounded-lg text-sm transition-colors disabled:opacity-50"
    >
      {isRunning ? "Starting..." : "Run Test"}
    </button>
  );
}
