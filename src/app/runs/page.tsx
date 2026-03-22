import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TestRunStatus } from "@/generated/prisma/enums";

const statusStyles: Record<TestRunStatus, string> = {
  [TestRunStatus.COMPLETED]: "bg-emerald-400/10 text-emerald-400",
  [TestRunStatus.FAILED]: "bg-red-400/10 text-red-400",
  [TestRunStatus.RUNNING]: "bg-yellow-400/10 text-yellow-400",
  [TestRunStatus.PENDING]: "bg-zinc-700 text-zinc-400",
};

export default async function RunsPage() {
  const runs = await prisma.testRun.findMany({
    orderBy: { startedAt: "desc" },
    include: {
      config: { select: { name: true } },
      _count: { select: { results: true } },
    },
  });

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">Test Runs</h2>
      <p className="text-zinc-400 mt-1">All detection test runs</p>

      {runs.length === 0 ? (
        <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
          <p className="text-zinc-500">No test runs yet.</p>
          <Link
            href="/configs"
            className="inline-block mt-3 text-sm text-emerald-400 hover:text-emerald-300"
          >
            Go to configurations to run a test
          </Link>
        </div>
      ) : (
        <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500">
                <th className="text-left p-3 font-medium">Config</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Score</th>
                <th className="text-left p-3 font-medium">Tests</th>
                <th className="text-left p-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
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
                    {run._count.results} check
                    {run._count.results !== 1 ? "s" : ""}
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
  );
}
