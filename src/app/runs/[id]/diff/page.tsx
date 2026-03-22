import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function DiffPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ against?: string }>;
}) {
  const { id } = await params;
  const { against } = await searchParams;

  if (!against) notFound();

  const [runA, runB] = await Promise.all([
    prisma.testRun.findUnique({
      where: { id },
      include: {
        config: { select: { name: true } },
        results: { orderBy: { testName: "asc" } },
      },
    }),
    prisma.testRun.findUnique({
      where: { id: against },
      include: {
        config: { select: { name: true } },
        results: { orderBy: { testName: "asc" } },
      },
    }),
  ]);

  if (!runA || !runB) notFound();

  // Build lookups
  const lookupA = new Map(runA.results.map((r) => [r.testName, r]));
  const lookupB = new Map(runB.results.map((r) => [r.testName, r]));

  // Collect all test names
  const allTests = new Set([...lookupA.keys(), ...lookupB.keys()]);

  // Categorise changes
  const improved: string[] = [];
  const regressed: string[] = [];
  const unchanged: string[] = [];
  const newTests: string[] = [];
  const removedTests: string[] = [];

  for (const test of allTests) {
    const a = lookupA.get(test);
    const b = lookupB.get(test);

    if (!b) {
      newTests.push(test);
    } else if (!a) {
      removedTests.push(test);
    } else if (!a.passed && b.passed) {
      // Was failing in older run, passing in newer = improved
      // runB is the "against" (older), runA is the current
      improved.push(test);
    } else if (a.passed && !b.passed) {
      regressed.push(test);
    } else {
      unchanged.push(test);
    }
  }

  const scoreA = runA.stealthScore;
  const scoreB = runB.stealthScore;
  const scoreDiff =
    scoreA !== null && scoreB !== null ? scoreA - scoreB : null;

  return (
    <div>
      <Link
        href={`/runs/${id}`}
        className="text-sm text-zinc-500 hover:text-zinc-300"
      >
        &larr; Back to run
      </Link>

      <h2 className="text-2xl font-bold tracking-tight mt-4">Diff View</h2>
      <p className="text-zinc-400 mt-1">
        Comparing {runA.config.name} runs
      </p>

      {/* Score comparison */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-center">
          <p className="text-xs text-zinc-500">Current Run</p>
          <p className="text-2xl font-bold mt-1">
            {scoreA?.toFixed(1) ?? "--"}%
          </p>
          <p className="text-xs text-zinc-600">
            {runA.startedAt.toLocaleDateString("en-GB", { dateStyle: "medium" })}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-center flex flex-col items-center justify-center">
          {scoreDiff !== null ? (
            <>
              <p
                className={`text-2xl font-bold ${
                  scoreDiff > 0
                    ? "text-emerald-400"
                    : scoreDiff < 0
                      ? "text-red-400"
                      : "text-zinc-500"
                }`}
              >
                {scoreDiff > 0 ? "+" : ""}
                {scoreDiff.toFixed(1)}%
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                {scoreDiff > 0
                  ? "Improved"
                  : scoreDiff < 0
                    ? "Regressed"
                    : "No change"}
              </p>
            </>
          ) : (
            <p className="text-zinc-600">--</p>
          )}
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-center">
          <p className="text-xs text-zinc-500">Previous Run</p>
          <p className="text-2xl font-bold mt-1">
            {scoreB?.toFixed(1) ?? "--"}%
          </p>
          <p className="text-xs text-zinc-600">
            {runB.startedAt.toLocaleDateString("en-GB", { dateStyle: "medium" })}
          </p>
        </div>
      </div>

      {/* Change summary */}
      <div className="grid grid-cols-4 gap-3 mt-6">
        <div className="bg-emerald-400/5 border border-emerald-400/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">
            {improved.length}
          </p>
          <p className="text-xs text-zinc-500">Improved</p>
        </div>
        <div className="bg-red-400/5 border border-red-400/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{regressed.length}</p>
          <p className="text-xs text-zinc-500">Regressed</p>
        </div>
        <div className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-zinc-500">
            {unchanged.length}
          </p>
          <p className="text-xs text-zinc-500">Unchanged</p>
        </div>
        <div className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-zinc-500">
            {newTests.length + removedTests.length}
          </p>
          <p className="text-xs text-zinc-500">Added/Removed</p>
        </div>
      </div>

      {/* Detailed changes */}
      {improved.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-emerald-400 mb-2">
            Improved (now passing)
          </h3>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {improved.map((test, i) => (
              <div
                key={test}
                className={`flex items-center justify-between p-3 ${
                  i < improved.length - 1 ? "border-b border-zinc-800/50" : ""
                }`}
              >
                <span className="text-sm">{test}</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-red-400">FAIL</span>
                  <span className="text-zinc-600">→</span>
                  <span className="text-emerald-400">PASS</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {regressed.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-red-400 mb-2">
            Regressed (now failing)
          </h3>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {regressed.map((test, i) => (
              <div
                key={test}
                className={`flex items-center justify-between p-3 ${
                  i < regressed.length - 1
                    ? "border-b border-zinc-800/50"
                    : ""
                }`}
              >
                <span className="text-sm">{test}</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-emerald-400">PASS</span>
                  <span className="text-zinc-600">→</span>
                  <span className="text-red-400">FAIL</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
