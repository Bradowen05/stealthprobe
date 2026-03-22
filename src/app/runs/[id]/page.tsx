import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TestRunStatus } from "@/generated/prisma/enums";

const statusStyles: Record<TestRunStatus, string> = {
  [TestRunStatus.COMPLETED]: "bg-emerald-400/10 text-emerald-400",
  [TestRunStatus.FAILED]: "bg-red-400/10 text-red-400",
  [TestRunStatus.RUNNING]: "bg-yellow-400/10 text-yellow-400",
  [TestRunStatus.PENDING]: "bg-zinc-700 text-zinc-400",
};

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const run = await prisma.testRun.findUnique({
    where: { id },
    include: {
      config: { select: { name: true, id: true } },
      results: { orderBy: { category: "asc" } },
    },
  });

  if (!run) notFound();

  // Group results by category
  const byCategory = run.results.reduce(
    (acc, result) => {
      const cat = result.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(result);
      return acc;
    },
    {} as Record<string, typeof run.results>
  );

  return (
    <div>
      <Link
        href="/runs"
        className="text-sm text-zinc-500 hover:text-zinc-300"
      >
        &larr; Back to test runs
      </Link>

      <div className="flex items-start justify-between mt-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Test Run — {run.config.name}
          </h2>
          <div className="flex items-center gap-3 mt-2">
            <span
              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusStyles[run.status]}`}
            >
              {run.status}
            </span>
            {run.stealthScore !== null && (
              <span className="text-lg font-bold text-emerald-400">
                {run.stealthScore.toFixed(0)}% stealth
              </span>
            )}
            <span className="text-sm text-zinc-600">
              {run.startedAt.toLocaleDateString("en-GB", {
                dateStyle: "medium",
              })}
            </span>
          </div>
        </div>
        <Link
          href={`/configs/${run.config.id}`}
          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
        >
          View Config
        </Link>
      </div>

      {run.results.length === 0 ? (
        <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
          <p className="text-zinc-500">
            {run.status === TestRunStatus.PENDING ||
            run.status === TestRunStatus.RUNNING
              ? "Test is still running... Refresh to check for results."
              : "No results recorded for this run."}
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {Object.entries(byCategory).map(([category, results]) => (
            <div key={category}>
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">
                {category}
              </h3>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                {results.map((result, i) => (
                  <div
                    key={result.id}
                    className={`flex items-center justify-between p-3 ${
                      i < results.length - 1
                        ? "border-b border-zinc-800/50"
                        : ""
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium">{result.testName}</p>
                      <p className="text-xs text-zinc-500">{result.testSite}</p>
                      {result.details && (
                        <p className="text-xs text-zinc-600 mt-1">
                          {result.details}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        result.passed
                          ? "bg-emerald-400/10 text-emerald-400"
                          : "bg-red-400/10 text-red-400"
                      }`}
                    >
                      {result.passed ? "PASS" : "FAIL"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
