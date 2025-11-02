"use client";

import React from "react";

type LecturerData = {
  lecturer_code?: string | null;
  academic_rank?: string | null;
  faculties?: { id?: number; name?: string | null } | null;
};

export default function LecturerInfoForm({ lecturer }: { lecturer: LecturerData }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-[#4e73df] border-b-2 border-[#4e73df] pb-1 mb-8">Thông tin giảng viên</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
        <div className="flex flex-row items-center gap-2">
          <label className="text-gray-700 font-medium flex-shrink-0">Mã giảng viên:</label>
          <input
            type="text"
            value={lecturer.lecturer_code || "-"}
            readOnly
            className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent"
          />
        </div>
        <div className="flex flex-row items-center gap-2">
          <label className="text-gray-700 font-medium flex-shrink-0">Học hàm/học vị:</label>
          <input
            type="text"
            value={lecturer.academic_rank || "-"}
            readOnly
            className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent"
          />
        </div>
        <div className="flex flex-row items-center gap-2">
          <label className="text-gray-700 font-medium flex-shrink-0">Khoa:</label>
          <input
            type="text"
            value={lecturer.faculties?.name || "-"}
            readOnly
            className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent"
          />
        </div>
      </div>
    </div>
  );
}


