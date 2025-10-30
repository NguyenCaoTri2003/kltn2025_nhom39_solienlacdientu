"use client";

import React from "react";

export interface ParentEntry {
  id: number;
  relationship: string;
  occupation: string;
  user: {
    id: number;
    full_name: string;
    role: string;
    email: string | null;
    phone: string | null;
    ethnic: string | null;
    status?: string | null;
    address: string | null;
    citizen_id_card: string | null;
  };
}

export default function ParentInfoForm({ parents }: { parents: ParentEntry[] }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-[#4e73df] border-b-2 border-[#4e73df] pb-1 mb-8">Quan hệ gia đình</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
        {parents?.map((p, idx) => (
          <React.Fragment key={p.id}>
            <div className="flex flex-row items-center gap-2">
              <label className="text-gray-700 font-medium flex-shrink-0">
                {p.relationship === "father"
                  ? "Họ tên cha:"
                  : p.relationship === "mother"
                  ? "Họ tên mẹ:"
                  : "Họ tên:"}
              </label>
              <input
                type="text"
                value={p.user.full_name || "-"}
                readOnly
                className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent"
              />
            </div>
            <div className="flex flex-row items-center gap-2">
              <label className="text-gray-700 font-medium flex-shrink-0">Nghề nghiệp:</label>
              <input
                type="text"
                value={p.occupation || "-"}
                readOnly
                className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent"
              />
            </div>
            <div className="flex flex-row items-center gap-2">
              <label className="text-gray-700 font-medium flex-shrink-0">Số điện thoại:</label>
              <input
                type="text"
                value={p.user.phone || "-"}
                readOnly
                className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent"
              />
            </div>
            <div className="flex flex-row items-center gap-2">
              <label className="text-gray-700 font-medium flex-shrink-0">Email:</label>
              <input
                type="text"
                value={p.user.email || "-"}
                readOnly
                className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent"
              />
            </div>
            <div className="flex flex-row items-center gap-2">
              <label className="text-gray-700 font-medium flex-shrink-0">Địa chỉ:</label>
              <input
                type="text"
                value={p.user.address || "-"}
                readOnly
                className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent"
              />
            </div>
            <div className="flex flex-row items-center gap-2">
              <label className="text-gray-700 font-medium flex-shrink-0">CCCD:</label>
              <input
                type="text"
                value={p.user.citizen_id_card || "-"}
                readOnly
                className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent"
              />
            </div>
            {idx < parents.length - 1 && (
              <div className="col-span-full"><hr className="my-4 border-gray-300 opacity-40" /></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}


