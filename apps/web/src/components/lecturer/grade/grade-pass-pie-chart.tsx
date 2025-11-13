"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

type GradePassItem = {
  summary?: {
    passed?: boolean | null;
  } | null;
};

interface GradePassPieChartProps {
  grades: GradePassItem[];
}

export const GradePassPieChart: React.FC<GradePassPieChartProps> = ({ grades }) => {
  if (!grades || grades.length === 0) return null;

  const validGrades = grades.filter(g => g.summary);

  const passedCount = validGrades.filter(g => g.summary?.passed).length;
  const failedCount = validGrades.filter(g => g.summary && !g.summary?.passed).length;
  const noDataCount = grades.length - validGrades.length;

  const data = [
    { name: "Đạt", value: passedCount },
    { name: "Không đạt", value: failedCount },
  ];

  if (noDataCount > 0) {
    data.push({ name: "Chưa xếp loại", value: noDataCount });
  }

  const COLORS = ["#4ade80", "#f87171", "#fbbf24"]; // xanh: đạt, đỏ: không đạt, vàng: chưa xếp loại

  return (
    <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-card/95 via-card/90 to-background/60 p-6 shadow-[0_24px_80px_-50px_rgba(59,130,246,0.45)] backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-lg font-semibold text-foreground">Tỷ lệ sinh viên đạt / không đạt</h4>
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {validGrades.length} sinh viên đã có kết quả
        </span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={110}
            label={(entry) => `${entry.name}: ${entry.value}`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: ValueType, name: NameType) => [`${value} sinh viên`, name]}
            contentStyle={{
              backgroundColor: "rgba(15,23,42,0.9)",
              borderRadius: "12px",
              border: "none",
              color: "#e2e8f0",
            }}
          />
          <Legend
            wrapperStyle={{ color: "#64748b" }}
            formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
