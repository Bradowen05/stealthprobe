import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TestRunStatus } from "@/generated/prisma/enums";
import { HistoryChart } from "./history-chart";

export default async function ConfigHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const config = await prisma.browserConfig.findUnique({
    where: { id },
    include: {
      testRuns: {
        where: { status: TestRunStatus.COMPLETED },
        orderBy: { startedAt: "asc" },
        select: {
          id: true,
          stealthScore: true,
          startedAt: true,
          completedAt: true,
          _count: { select: { results: true } },
        },
      },
    },
  });

  if (!config) notFound();

  const chartData = config.testRuns.map((run, i) => ({
    run: `#${i + 1}`,
    runId: run.id,
    score: run.stealthScore ?? 0,
    date: run.startedAt.toLocaleDateString("en-GB", { dateStyle: "medium" }),
    tests: run._count.results,
  }));

  return (
    <div>
      <Link
        href={`/configs/${id}`}
        className="text-sm text-zinc-500 hover:text-zinc-300"
      >
        &larr; Back to {config.name}
      </Link>

      <h2 className="text-2xl font-bold tracking-tight mt-4">
        History — {config.name}
      </h2>
      <p className="text-zinc-400 mt-1">
        Stealth score trend across {config.testRuns.length} completed run
        {config.testRuns.length !== 1 ? "s" : ""}
      </p>

      {config.testRuns.length === 0 ? (
        <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
          <p className="text-zinc-500">
            No completed runs yet for this configuration.
          </p>
        </div>
      ) : (
        <>
          {/* Line chart */}
          <div className="mt-6">
            <HistoryChart data={chartData} />
          </div>

          {/* Run list */}
          <div className="mt-8">
            <h3 className="text-sm font-medium text-zinc-400 mb-3">
              All Runs
            </h3>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500">
                    <th className="text-left p-3 font-medium">#</th>
                    <th className="text-left p-3 font-medium">Score</th>
                    <th className="text-left p-3 font-medium">Tests</th>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {config.testRuns
                    .slice()
                    .reverse()
                    .map((run, i) => (
                      <tr
                        key={run.id}
                        className="border-b border-zinc-800/50 hover:bg-zinc-800/30"
                      >
                        <td className="p-3 text-zinc-500">
                          #{config.testRuns.length - i}
                        </td>
                        <td className="p-3">
                          <span
                            className={`font-bold ${
                              (run.stealthScore ?? 0) >= 80
                                ? "text-emerald-400"
                                : (run.stealthScore ?? 0) >= 50
                                  ? "text-yellow-400"
                                  : "text-red-400"
                            }`}
                          >
                            {run.stealthScore?.toFixed(1) ?? "--"}%
                          </span>
                        </td>
                        <td className="p-3 text-zinc-500">
                          {run._count.results} checks
                        </td>
                        <td className="p-3 text-zinc-500">
                          {run.startedAt.toLocaleDateString("en-GB", {
                            dateStyle: "medium",
                          })}
                        </td>
                        <td className="p-3">
                          <Link
                            href={`/runs/${run.id}`}
                            className="text-xs text-emerald-400 hover:text-emerald-300 mr-3"
                          >
                            View
                          </Link>
                          {config.testRuns.length - i > 1 && (
                            <Link
                              href={`/runs/${run.id}/diff?against=${config.testRuns[config.testRuns.length - i - 2]?.id}`}
                              className="text-xs text-zinc-500 hover:text-zinc-300"
                            >
                              Diff vs prev
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
