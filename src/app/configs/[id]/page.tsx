import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DeleteConfigButton } from "./delete-button";
import { RunTestButton } from "./run-button";

export default async function ConfigDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const config = await prisma.browserConfig.findUnique({
    where: { id },
    include: {
      _count: { select: { testRuns: true } },
    },
  });

  if (!config) notFound();

  return (
    <div>
      <Link
        href="/configs"
        className="text-sm text-zinc-500 hover:text-zinc-300"
      >
        &larr; Back to configurations
      </Link>

      <div className="flex items-start justify-between mt-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{config.name}</h2>
          {config.description && (
            <p className="text-zinc-400 mt-1">{config.description}</p>
          )}
          <p className="text-sm text-zinc-600 mt-2">
            {config._count.testRuns} test run
            {config._count.testRuns !== 1 ? "s" : ""} &middot; Created{" "}
            {config.createdAt.toLocaleDateString("en-GB", {
              dateStyle: "medium",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <RunTestButton configId={id} />
          <Link
            href={`/configs/${id}/edit`}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
          >
            Edit
          </Link>
          <DeleteConfigButton id={id} name={config.name} />
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium text-zinc-400 mb-2">
          Playwright Config JSON
        </h3>
        <pre className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm font-mono overflow-x-auto">
          {JSON.stringify(config.configJson, null, 2)}
        </pre>
      </div>
    </div>
  );
}
