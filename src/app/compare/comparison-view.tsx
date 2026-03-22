"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CategoryChart } from "./category-chart";

interface RunOption {
  id: string;
  configName: string;
  stealthScore: number | null;
  startedAt: string;
}

interface TestResult {
  testSite: string;
  testName: string;
  passed: boolean;
  details: string | null;
  category: string;
}

interface SelectedRun extends RunOption {
  results: TestResult[];
}

interface ComparisonViewProps {
  allRuns: RunOption[];
  selectedRuns: SelectedRun[];
  selectedIds: string[];
}

export function ComparisonView({
  allRuns,
  selectedRuns,
  selectedIds,
}: ComparisonViewProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(selectedIds);

  function toggleRun(runId: string) {
    const next = selected.includes(runId)
      ? selected.filter((id) => id !== runId)
      : selected.length < 3
        ? [...selected, runId]
        : selected;

    setSelected(next);
    router.push(`/compare?runs=${next.join(",")}`);
  }

  // Build a unified list of all test names across selected runs
  const allTestNames = new Set<string>();
  selectedRuns.forEach((run) =>
    run.results.forEach((r) => allTestNames.add(r.testName))
  );

  // Group test names by category
  const testsByCategory = new Map<string, string[]>();
  selectedRuns.forEach((run) =>
    run.results.forEach((r) => {
      if (!testsByCategory.has(r.category)) {
        testsByCategory.set(r.category, []);
      }
      const arr = testsByCategory.get(r.category)!;
      if (!arr.includes(r.testName)) arr.push(r.testName);
    })
  );

  // Build per-run lookup: testName -> result
  const runLookups = selectedRuns.map((run) => {
    const map = new Map<string, TestResult>();
    run.results.forEach((r) => map.set(r.testName, r));
    return map;
  });

  // Category scores for the chart
  const categoryScores = Array.from(testsByCategory.entries()).map(
    ([category, tests]) => {
      const entry: Record<string, string | number> = { category };
      selectedRuns.forEach((run, i) => {
        const lookup = runLookups[i];
        const catResults = tests.map((t) => lookup.get(t));
        const passed = catResults.filter((r) => r?.passed).length;
        const total = catResults.filter((r) => r !== undefined).length;
        entry[run.configName] = total > 0 ? Math.round((passed / total) * 100) : 0;
      });
      return entry;
    }
  );

  return (
    <div className="mt-6">
      {/* Run selector */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        {allRuns.map((run) => {
          const isSelected = selected.includes(run.id);
          return (
            <button
              key={run.id}
              onClick={() => toggleRun(run.id)}
              className={`text-left p-3 rounded-xl border transition-colors ${
                isSelected
                  ? "bg-emerald-500/10 border-emerald-500/50"
                  : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <p className="text-sm font-medium truncate">{run.configName}</p>
              <div className="flex items-center gap-2 mt-1">
                {run.stealthScore !== null && (
                  <span
                    className={`text-xs font-bold ${
                      run.stealthScore >= 80
                        ? "text-emerald-400"
                        : run.stealthScore >= 50
                          ? "text-yellow-400"
                          : "text-red-400"
                    }`}
                  >
                    {run.stealthScore.toFixed(0)}%
                  </span>
                )}
                <span className="text-xs text-zinc-600">
                  {new Date(run.startedAt).toLocaleDateString("en-GB", {
                    dateStyle: "medium",
                  })}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {selectedRuns.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
          <p className="text-zinc-500">
            Select test runs above to compare them
          </p>
        </div>
      ) : (
        <>
          {/* Score summary */}
          <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: `repeat(${selectedRuns.length}, 1fr)` }}>
            {selectedRuns.map((run) => (
              <div
                key={run.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-center"
              >
                <p className="text-sm text-zinc-400 truncate">
                  {run.configName}
                </p>
                <p
                  className={`text-4xl font-bold mt-2 ${
                    (run.stealthScore ?? 0) >= 80
                      ? "text-emerald-400"
                      : (run.stealthScore ?? 0) >= 50
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}
                >
                  {run.stealthScore?.toFixed(0) ?? "--"}%
                </p>
                <p className="text-xs text-zinc-600 mt-1">stealth score</p>
              </div>
            ))}
          </div>

          {/* Category breakdown chart */}
          {categoryScores.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-zinc-400 mb-3">
                Score by Category
              </h3>
              <CategoryChart
                data={categoryScores}
                configNames={selectedRuns.map((r) => r.configName)}
              />
            </div>
          )}

          {/* Per-test breakdown table */}
          {Array.from(testsByCategory.entries()).map(([category, tests]) => (
            <div key={category} className="mb-6">
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">
                {category}
              </h3>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500">
                      <th className="text-left p-3 font-medium">Test</th>
                      {selectedRuns.map((run) => (
                        <th
                          key={run.id}
                          className="text-center p-3 font-medium"
                        >
                          {run.configName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tests.map((testName) => (
                      <tr
                        key={testName}
                        className="border-b border-zinc-800/50"
                      >
                        <td className="p-3 text-zinc-300">{testName}</td>
                        {runLookups.map((lookup, i) => {
                          const result = lookup.get(testName);
                          return (
                            <td key={i} className="p-3 text-center">
                              {result ? (
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                    result.passed
                                      ? "bg-emerald-400/10 text-emerald-400"
                                      : "bg-red-400/10 text-red-400"
                                  }`}
                                >
                                  {result.passed ? "PASS" : "FAIL"}
                                </span>
                              ) : (
                                <span className="text-zinc-700">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
