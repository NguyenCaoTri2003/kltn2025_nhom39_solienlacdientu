"use client";

import React from "react";

type Row = {
  is_warned?: boolean;
  failed_over_50: boolean;
  under_threshold: boolean;
  proposed_warning_level: "FIRST" | "SECOND" | "FINAL" | null;
};

export const WarningSummaryStats: React.FC<{ rows: Row[] }> = ({ rows }) => {
  if (!rows || rows.length === 0) return null;

  const total = rows.length;
  const warned = rows.filter((r) => r.is_warned).length;
  const failed50 = rows.filter((r) => r.failed_over_50).length;
  const underThr = rows.filter((r) => r.under_threshold).length;
  const l1 = rows.filter((r) => r.proposed_warning_level === "FIRST").length;
  const l2 = rows.filter((r) => r.proposed_warning_level === "SECOND").length;
  const l3 = rows.filter((r) => r.proposed_warning_level === "FINAL").length;

  return (
    <div className="mt-6 p-4 border rounded-lg bg-white space-y-3">
      <h4 className="text-lg font-semibold">Thống kê cảnh cáo học tập</h4>
      <div>Tổng số kết quả: {total}</div>
      <div>Đã cảnh cáo: {warned}</div>
      <div>&gt;50% tín chỉ rớt: {failed50}</div>
      <div>Dưới ngưỡng GPA: {underThr}</div>
      <div>
        Phân bố mức đề xuất:
        <span className="ml-2 mr-3">C1: {l1}</span>
        <span className="mr-3">C2: {l2}</span>
        <span>C3: {l3}</span>
      </div>
    </div>
  );
};


