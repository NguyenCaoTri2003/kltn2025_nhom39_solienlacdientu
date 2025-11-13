"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";

type GradeDistributionItem = {
  summary?: {
    letter_grade?: string | null;
  } | null;
};

interface GradeDistributionChartProps {
  grades: GradeDistributionItem[];
}

export const GradeDistributionChart: React.FC<GradeDistributionChartProps> = ({ grades }) => {
  if (!grades || grades.length === 0) return null;

  const distribution: Record<string, number> = {};
  grades.forEach(g => {
    const grade = g.summary?.letter_grade || "Chưa xếp loại";
    distribution[grade] = (distribution[grade] || 0) + 1;
  });

  const data = Object.entries(distribution).map(([letter, count]) => ({
    letter,
    count,
  }));

  return (
    <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-card/95 via-card/90 to-background/60 p-6 shadow-[0_24px_80px_-50px_rgba(59,130,246,0.45)] backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-lg font-semibold text-foreground">Biểu đồ phân bố xếp loại</h4>
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Tổng {grades.length} sinh viên
        </span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="#0f172a0f" />
          <XAxis dataKey="letter" stroke="#64748b" />
          <YAxis allowDecimals={false} stroke="#64748b" />
          <Tooltip
            formatter={(value: ValueType): [ValueType, NameType] => [value, "Số sinh viên"]}
            contentStyle={{
              backgroundColor: "rgba(15,23,42,0.9)",
              borderRadius: "12px",
              border: "none",
              color: "#e2e8f0",
            }}
          />
          <defs>
            <linearGradient id="gradeBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <Bar dataKey="count" fill="url(#gradeBarGradient)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
