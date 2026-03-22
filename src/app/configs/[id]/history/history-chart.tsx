"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface HistoryChartProps {
  data: Array<{
    run: string;
    score: number;
    date: string;
    tests: number;
  }>;
}

export function HistoryChart({ data }: HistoryChartProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="run"
            tick={{ fill: "#71717a", fontSize: 12 }}
            axisLine={{ stroke: "#27272a" }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#71717a", fontSize: 12 }}
            axisLine={{ stroke: "#27272a" }}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              background: "#18181b",
              border: "1px solid #27272a",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value) => [`${value}%`, "Stealth Score"]}
            labelFormatter={(_label, payload) => {
              const item = payload?.[0]?.payload;
              return item ? `${item.date} — ${item.tests} tests` : "";
            }}
          />
          <ReferenceLine
            y={80}
            stroke="#34d399"
            strokeDasharray="3 3"
            strokeOpacity={0.3}
          />
          <ReferenceLine
            y={50}
            stroke="#facc15"
            strokeDasharray="3 3"
            strokeOpacity={0.3}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#34d399"
            strokeWidth={2}
            dot={{ fill: "#34d399", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
