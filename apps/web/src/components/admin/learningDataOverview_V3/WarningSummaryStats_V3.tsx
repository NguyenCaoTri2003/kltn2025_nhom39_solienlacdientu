"use client";

import React from "react";

type Row = {
  is_warned?: boolean;
  failed_over_50: boolean;
  cumulative_failed_over_24?: boolean;
  semester_gpa_below_threshold?: boolean;
  cumulative_gpa_below_threshold?: boolean;
  proposed_warning_level: "FIRST" | "SECOND" | "FINAL" | "EXPULSION" | null;
  expulsion_candidate?: boolean;
  consecutive_warnings_count?: number;
};

export const WarningSummaryStats: React.FC<{ rows: Row[] }> = ({ rows }) => {
  if (!rows || rows.length === 0) return null;

  const total = rows.length;
  const warned = rows.filter((r) => r.is_warned).length;
  const failed50 = rows.filter((r) => r.failed_over_50).length;
  const failed24 = rows.filter((r) => r.cumulative_failed_over_24).length;
  const semGpaBelow = rows.filter((r) => r.semester_gpa_below_threshold).length;
  const cumGpaBelow = rows.filter((r) => r.cumulative_gpa_below_threshold).length;
  const l1 = rows.filter((r) => r.proposed_warning_level === "FIRST").length;
  const l2 = rows.filter((r) => r.proposed_warning_level === "SECOND").length;
  const l3 = rows.filter((r) => r.proposed_warning_level === "FINAL").length;
  const l4 = rows.filter((r) => r.proposed_warning_level === "EXPULSION").length;
  const expulsion = rows.filter((r) => r.expulsion_candidate).length;
  const consecutive = rows.filter((r) => (r.consecutive_warnings_count ?? 0) >= 2).length;

  return (
    <div className="mt-6 p-4 border rounded-lg bg-white space-y-3">
      <h4 className="text-lg font-semibold">Thống kê cảnh cáo học tập</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="font-semibold text-gray-700">Tổng số kết quả</div>
          <div className="text-2xl font-bold">{total}</div>
        </div>
        <div>
          <div className="font-semibold text-gray-700">Đã cảnh cáo</div>
          <div className="text-2xl font-bold">{warned}</div>
        </div>
        <div>
          <div className="font-semibold text-gray-700">Nguy cơ buộc thôi học</div>
          <div className="text-2xl font-bold text-red-600">{expulsion}</div>
        </div>
        <div>
          <div className="font-semibold text-gray-700">Cảnh cáo liên tiếp ≥2</div>
          <div className="text-2xl font-bold text-orange-600">{consecutive}</div>
        </div>
      </div>
      
      <div className="border-t pt-3 mt-3">
        <div className="font-semibold mb-2">Tiêu chí vi phạm:</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div>&gt;50% tín chỉ rớt: <span className="font-semibold">{failed50}</span></div>
          <div>Nợ &gt;24 tín chỉ: <span className="font-semibold">{failed24}</span></div>
          <div>ĐTBHL dưới ngưỡng: <span className="font-semibold">{semGpaBelow}</span></div>
          <div>ĐTBHTL dưới ngưỡng: <span className="font-semibold">{cumGpaBelow}</span></div>
        </div>
      </div>

      <div className="border-t pt-3 mt-3">
        <div className="font-semibold mb-2">Phân bố mức đề xuất:</div>
        <div className="flex gap-4">
          <div>C1: <span className="font-semibold">{l1}</span></div>
          <div>C2: <span className="font-semibold">{l2}</span></div>
          <div>C3: <span className="font-semibold text-orange-600">{l3}</span></div>
          <div>Buộc thôi học: <span className="font-semibold text-red-600">{l4}</span></div>
        </div>
      </div>
    </div>
  );
};


