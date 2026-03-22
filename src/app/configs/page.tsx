import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ConfigsPage() {
  const configs = await prisma.browserConfig.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { testRuns: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Browser Configurations
          </h2>
          <p className="text-zinc-400 mt-1">
            Define Playwright launch configs to test against detection sites
          </p>
        </div>
        <Link
          href="/configs/new"
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-medium rounded-lg text-sm transition-colors"
        >
          New Configuration
        </Link>
      </div>

      {configs.length === 0 ? (
        <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
          <p className="text-zinc-500">No configurations yet.</p>
          <p className="text-zinc-600 text-sm mt-1">
            Create your first browser configuration to start testing.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {configs.map((config) => (
            <Link
              key={config.id}
              href={`/configs/${config.id}`}
              className="block bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{config.name}</h3>
                  {config.description && (
                    <p className="text-sm text-zinc-400 mt-1">
                      {config.description}
                    </p>
                  )}
                </div>
                <div className="text-sm text-zinc-500">
                  {config._count.testRuns} run
                  {config._count.testRuns !== 1 ? "s" : ""}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
