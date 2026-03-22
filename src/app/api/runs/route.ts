import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeTestRun } from "@/lib/runner";

export async function POST(request: Request) {
  const body = await request.json();
  const { configId } = body;

  if (!configId || typeof configId !== "string") {
    return NextResponse.json(
      { error: "configId is required" },
      { status: 400 }
    );
  }

  // Verify the config exists
  const config = await prisma.browserConfig.findUnique({
    where: { id: configId },
  });

  if (!config) {
    return NextResponse.json(
      { error: "Config not found" },
      { status: 404 }
    );
  }

  // Create a pending test run
  const testRun = await prisma.testRun.create({
    data: { configId },
  });

  // Fire and forget — run the test in the background
  // The client can poll for status updates
  executeTestRun(testRun.id).catch(console.error);

  return NextResponse.json({ testRunId: testRun.id }, { status: 201 });
}
