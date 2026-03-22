"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Polls the run status API and refreshes the page when the run completes.
 * Only renders when the run is PENDING or RUNNING.
 */
export function PollStatus({ runId }: { runId: string }) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/runs/${runId}`);
        const data = await res.json();
        if (data.status === "COMPLETED" || data.status === "FAILED") {
          clearInterval(interval);
          router.refresh();
        }
      } catch {
        // Ignore polling errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [runId, router]);

  return (
    <div className="mt-4 flex items-center gap-2 text-sm text-zinc-400">
      <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
      Running tests... This page will update automatically.
    </div>
  );
}
