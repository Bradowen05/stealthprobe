import { prisma } from "@/lib/prisma";
import { TestRunStatus } from "@/generated/prisma/enums";
import Link from "next/link";
import { ComparisonView } from "./comparison-view";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ runs?: string }>;
}) {
  const { runs: runIds } = await searchParams;

  // Get all completed runs for the selector
  const allRuns = await prisma.testRun.findMany({
    where: { status: TestRunStatus.COMPLETED },
    orderBy: { startedAt: "desc" },
    include: { config: { select: { name: true } } },
    take: 50,
  });

  // If run IDs are provided, load full data for comparison
  const selectedIds = runIds ? runIds.split(",").slice(0, 3) : [];
  const selectedRuns =
    selectedIds.length > 0
      ? await prisma.testRun.findMany({
          where: { id: { in: selectedIds } },
          include: {
            config: { select: { name: true } },
            results: { orderBy: { category: "asc" } },
          },
        })
      : [];

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">
        Compare Configurations
      </h2>
      <p className="text-zinc-400 mt-1">
        Select up to 3 test runs to compare side-by-side
      </p>

      {allRuns.length === 0 ? (
        <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
          <p className="text-zinc-500">No completed test runs yet.</p>
          <Link
            href="/configs"
            className="inline-block mt-3 text-sm text-emerald-400 hover:text-emerald-300"
          >
            Run some tests first
          </Link>
        </div>
      ) : (
        <ComparisonView
          allRuns={allRuns.map((r) => ({
            id: r.id,
            configName: r.config.name,
            stealthScore: r.stealthScore,
            startedAt: r.startedAt.toISOString(),
          }))}
          selectedRuns={selectedRuns.map((r) => ({
            id: r.id,
            configName: r.config.name,
            stealthScore: r.stealthScore,
            startedAt: r.startedAt.toISOString(),
            results: r.results.map((res) => ({
              testSite: res.testSite,
              testName: res.testName,
              passed: res.passed,
              details: res.details,
              category: res.category,
            })),
          }))}
          selectedIds={selectedIds}
        />
      )}
    </div>
  );
}
