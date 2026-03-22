"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

// Matches TestRunStatus enum values — can't import Prisma enums in client components
const TERMINAL_STATUSES = ["COMPLETED", "FAILED"] as const;

/**
 * Polls the run status API and refreshes the page when the run completes.
 * Only renders when the run is PENDING or RUNNING.
 */
export function PollStatus({ runId }: { runId: string }) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/runs/${runId}`);
        const data = await res.json();
        if (TERMINAL_STATUSES.includes(data.status)) {
          clearInterval(interval);
          routerRef.current.refresh();
        }
      } catch {
        // Ignore polling errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [runId]);

  return (
    <div className="mt-4 flex items-center gap-2 text-sm text-zinc-400">
      <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
      Running tests... This page will update automatically.
    </div>
  );
}
