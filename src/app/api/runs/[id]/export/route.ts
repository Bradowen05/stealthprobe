import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Invalid run ID" }, { status: 400 });
  }

  const run = await prisma.testRun.findUnique({
    where: { id },
    include: {
      config: true,
      results: { orderBy: [{ category: "asc" }, { testName: "asc" }] },
    },
  });

  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  const exportData = {
    exportedAt: new Date().toISOString(),
    testRun: {
      id: run.id,
      status: run.status,
      stealthScore: run.stealthScore,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
    },
    config: {
      name: run.config.name,
      description: run.config.description,
      configJson: run.config.configJson,
    },
    results: run.results.map((r) => ({
      testSite: r.testSite,
      testName: r.testName,
      passed: r.passed,
      details: r.details,
      category: r.category,
    })),
    summary: {
      totalTests: run.results.length,
      passed: run.results.filter((r) => r.passed).length,
      failed: run.results.filter((r) => !r.passed).length,
    },
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="stealthprobe-${run.config.name.replace(/\s+/g, "-").toLowerCase()}-${run.startedAt.toISOString().split("T")[0]}.json"`,
    },
  });
}
