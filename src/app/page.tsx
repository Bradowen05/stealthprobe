import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TestRunStatus } from "@/generated/prisma/enums";

const statusStyles: Record<TestRunStatus, string> = {
  [TestRunStatus.COMPLETED]: "bg-emerald-400/10 text-emerald-400",
  [TestRunStatus.FAILED]: "bg-red-400/10 text-red-400",
  [TestRunStatus.RUNNING]: "bg-yellow-400/10 text-yellow-400",
  [TestRunStatus.PENDING]: "bg-zinc-700 text-zinc-400",
};

export default async function DashboardPage() {
  const [configCount, runCount, latestRuns, avgScore] = await Promise.all([
    prisma.browserConfig.count(),
    prisma.testRun.count(),
    prisma.testRun.findMany({
      take: 5,
      orderBy: { startedAt: "desc" },
      include: { config: { select: { name: true } } },
    }),
    prisma.testRun.aggregate({
      _avg: { stealthScore: true },
      where: { status: TestRunStatus.COMPLETED, stealthScore: { not: null } },
    }),
  ]);

  const avgScoreValue = avgScore._avg.stealthScore;

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
      <p className="text-zinc-400 mt-1">
        Overview of your browser detection testing
      </p>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-sm text-zinc-500">Configurations</p>
          <p className="text-3xl font-bold mt-1">{configCount}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-sm text-zinc-500">Total Test Runs</p>
          <p className="text-3xl font-bold mt-1">{runCount}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-sm text-zinc-500">Average Stealth Score</p>
          <p
            className={`text-3xl font-bold mt-1 ${
              avgScoreValue === null
                ? "text-zinc-600"
                : avgScoreValue >= 80
                  ? "text-emerald-400"
                  : avgScoreValue >= 50
                    ? "text-yellow-400"
                    : "text-red-400"
            }`}
          >
            {avgScoreValue !== null ? `${avgScoreValue.toFixed(0)}%` : "--"}
          </p>
        </div>
      </div>

      {/* Recent runs */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold">Recent Test Runs</h3>
        {latestRuns.length === 0 ? (
          <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
            <p className="text-zinc-500">No test runs yet.</p>
            <Link
              href="/configs"
              className="inline-block mt-3 text-sm text-emerald-400 hover:text-emerald-300"
            >
              Create a configuration to get started
            </Link>
          </div>
        ) : (
          <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="text-left p-3 font-medium">Config</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Score</th>
                  <th className="text-left p-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {latestRuns.map((run) => (
                  <tr
                    key={run.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/30"
                  >
                    <td className="p-3">
                      <Link
                        href={`/runs/${run.id}`}
                        className="hover:text-emerald-400"
                      >
                        {run.config.name}
                      </Link>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusStyles[run.status]}`}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {run.stealthScore !== null
                        ? `${run.stealthScore.toFixed(0)}%`
                        : "--"}
                    </td>
                    <td className="p-3 text-zinc-500">
                      {run.startedAt.toLocaleDateString("en-GB", {
                        dateStyle: "medium",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
