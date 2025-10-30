"use client";

import React from "react";

export interface ChildEntry {
  relationship: string;
  student: {
    id: number;
    student_code: string;
    academic_status: string;
    class: {
      id: number;
      name: string;
      majors: {
        id: number;
        faculties: {
          id: number;
          name: string;
        };
      };
      class_code: string;
    };
  };
  user: {
    id: number;
    role: string;
    email: string | null;
    phone: string | null;
    status?: string;
    full_name: string;
  };
}

export default function ChildrenInfoForm({ childrenList }: { childrenList: ChildEntry[] }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-[#4e73df] border-b-2 border-[#4e73df] pb-1 mb-8">Quan hệ con cái</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
        {childrenList?.map((c, idx) => (
          <React.Fragment key={`${c.user.id}-${idx}`}>
            <div className="flex flex-row items-center gap-2">
              <label className="text-gray-700 font-medium flex-shrink-0">
                {"Họ tên con:"}
              </label>
              <input
                type="text"
                value={c.user.full_name || "-"}
                readOnly
                className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent"
              />
            </div>
            <div className="flex flex-row items-center gap-2">
              <label className="text-gray-700 font-medium flex-shrink-0">Mã SV:</label>
              <input
                type="text"
                value={c.student?.student_code || "-"}
                readOnly
                className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent"
              />
            </div>
            <div className="flex flex-row items-center gap-2">
              <label className="text-gray-700 font-medium flex-shrink-0">Lớp:</label>
              <input
                type="text"
                value={c.student?.class?.name || "-"}
                readOnly
                className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent"
              />
            </div>
            <div className="flex flex-row items-center gap-2">
              <label className="text-gray-700 font-medium flex-shrink-0">Khoa:</label>
              <input
                type="text"
                value={c.student?.class?.majors?.faculties?.name || "-"}
                readOnly
                className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent"
              />
            </div>
            <div className="flex flex-row items-center gap-2">
              <label className="text-gray-700 font-medium flex-shrink-0">Email:</label>
              <input
                type="text"
                value={c.user.email || "-"}
                readOnly
                className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent"
              />
            </div>
            <div className="flex flex-row items-center gap-2">
              <label className="text-gray-700 font-medium flex-shrink-0">Số điện thoại:</label>
              <input
                type="text"
                value={c.user.phone || "-"}
                readOnly
                className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent"
              />
            </div>
            {idx < childrenList.length - 1 && (
              <div className="col-span-full"><hr className="my-4 border-gray-300 opacity-40" /></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}


