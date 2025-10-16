"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface GradeDistributionChartProps {
  grades: any[];
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
    <div className="mt-6 p-4 border rounded-lg bg-background">
      <h4 className="text-lg font-semibold mb-4">Biểu đồ phân bố xếp loại</h4>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="letter" />
          <YAxis allowDecimals={false} />
          <Tooltip
            formatter={(value: any) => [value, "Số sinh viên"]}
            contentStyle={{ backgroundColor: "#f9fafb", borderRadius: "8px", border: "none" }}
          />
          <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
