"use client";

import React from "react";
import { translateAcademicStatus, translateTrainingLevel, translateTrainingType } from "@packages/utils/translations";

type StudentData = {
  address?: string | null;
  student?: {
    academic_status?: string;
    academic_year?: string;
    student_code?: string;
    classes?: { name?: string; majors?: { faculties?: { name?: string } } };
    class?: { name?: string; majors?: { faculties?: { name?: string } } };
    contact_address?: string | null;
    type_of_tranning?: string | null;
    training_level?: string | null;
  };
};

export default function StudentInfoForm({ studentData }: { studentData: StudentData }) {
  const user = studentData;

  return (
    <div>
        <h2 className="text-xl font-semibold text-[#4e73df] border-b-2 border-[#4e73df] pb-1 mb-8">
          Thông tin học vấn
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
          <div className="flex flex-row items-center gap-2">
            <label className="text-gray-700 font-medium flex-shrink-0">Trạng thái:</label>
            <input type="text" readOnly value={translateAcademicStatus(user.student?.academic_status || "-")} className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent" />
          </div>
          <div className="flex flex-row items-center gap-2">
            <label className="text-gray-700 font-medium flex-shrink-0">Khoá học:</label>
            <input type="text" readOnly value={user.student?.academic_year || "-"} className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent" />
          </div>
          <div className="flex flex-row items-center gap-2">
            <label className="text-gray-700 font-medium flex-shrink-0">Mã sinh viên:</label>
            <input type="text" readOnly value={user.student?.student_code || "-"} className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent" />
          </div>
          <div className="flex flex-row items-center gap-2">
            <label className="text-gray-700 font-medium flex-shrink-0">Lớp học:</label>
            <input type="text" readOnly value={user.student?.classes?.name || user.student?.class?.name || "-"} className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent" />
          </div>
          <div className="flex flex-row items-center gap-2">
            <label className="text-gray-700 font-medium flex-shrink-0">Khoa:</label>
            <input type="text" readOnly value={user.student?.classes?.majors?.faculties?.name || user.student?.class?.majors?.faculties?.name || "-"} className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent" />
          </div>
          <div className="flex flex-row items-center gap-2">
            <label className="text-gray-700 font-medium flex-shrink-0">Loại đào tạo:</label>
            <input type="text" readOnly value={translateTrainingType(user.student?.type_of_tranning || "-" )} className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent" />
          </div>
          <div className="flex flex-row items-center gap-2">
            <label className="text-gray-700 font-medium flex-shrink-0">Trình độ đào tạo:</label>
            <input type="text" readOnly value={translateTrainingLevel(user.student?.training_level || "-" )} className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent" />
          </div>
        </div>

      
    </div>
  );
}
