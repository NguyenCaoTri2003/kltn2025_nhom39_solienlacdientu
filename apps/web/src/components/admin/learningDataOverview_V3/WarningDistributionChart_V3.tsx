"use client";

import React from "react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from "recharts";

type Row = {
  proposed_warning_level: "FIRST" | "SECOND" | "FINAL" | "EXPULSION" | null;
  failed_over_50: boolean;
  cumulative_failed_over_24?: boolean;
  semester_gpa_below_threshold?: boolean;
  cumulative_gpa_below_threshold?: boolean;
  expulsion_candidate?: boolean;
  is_warned?: boolean;
};

export const WarningDistributionChart: React.FC<{ rows: Row[] }> = ({ rows }) => {
  if (!rows || rows.length === 0) return null;

  const distribution: Record<string, number> = {
    "Đề xuất C1": rows.filter((r) => r.proposed_warning_level === "FIRST").length,
    "Đề xuất C2": rows.filter((r) => r.proposed_warning_level === "SECOND").length,
    "Đề xuất C3": rows.filter((r) => r.proposed_warning_level === "FINAL").length,
    "Buộc thôi học": rows.filter((r) => r.proposed_warning_level === "EXPULSION").length,
    ">50% rớt": rows.filter((r) => r.failed_over_50).length,
    "Nợ >24 tín chỉ": rows.filter((r) => r.cumulative_failed_over_24).length,
    "ĐTBHL dưới ngưỡng": rows.filter((r) => r.semester_gpa_below_threshold).length,
    "ĐTBHTL dưới ngưỡng": rows.filter((r) => r.cumulative_gpa_below_threshold).length,
    "Nguy cơ buộc thôi học": rows.filter((r) => r.expulsion_candidate).length,
  };

  const data = Object.entries(distribution).map(([label, count]) => ({ label, count }));

  return (
    <div className="mt-6 p-4 border rounded-lg bg-white">
      <h4 className="text-lg font-semibold mb-4">Biểu đồ phân bố tiêu chí/mức</h4>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis allowDecimals={false} />
          <Tooltip
            formatter={(value: number) => [value, "Số SV"]}
            contentStyle={{ backgroundColor: "#f9fafb", borderRadius: 8, border: "none" }}
          />
          <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};


