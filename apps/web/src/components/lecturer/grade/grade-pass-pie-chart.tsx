"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface GradePassPieChartProps {
  grades: any[];
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
    <div className="mt-6 p-4 border rounded-lg bg-background">
      <h4 className="text-lg font-semibold mb-4">Tỷ lệ sinh viên đạt / không đạt</h4>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={(entry) => `${entry.name}: ${entry.value}`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
