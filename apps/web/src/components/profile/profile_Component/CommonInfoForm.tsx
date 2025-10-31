"use client";

import React from "react";
import { translateTrainingType, translateTrainingLevel } from "@packages/utils/translations";

export interface BasicUserInfo {
  id: number;
  full_name: string;
  phone: string | null;
  email: string | null;
  citizen_id_card: string | null;
  address: string | null;
  ethnic: string | null;
  role?: string;
  student_date_of_birth?: string | null;
  student_contact_address?: string | null;
  student_code?: string | null;
  lecturer_code?: string | null;
}

export default function CommonInfoForm({ user }: { user: BasicUserInfo }) {

  return (
    <div>
        <h2 className="text-xl font-semibold text-[#4e73df] border-b-2 border-[#4e73df] pb-1 mb-8">
          Thông tin cá nhân
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
          {(user.role === "student" || user.role === "lecturer") && (
            <div className="flex flex-row items-center gap-2">
              <label
                htmlFor="userId"
                className="text-gray-700 font-medium flex-shrink-0"
              >
                {user.role === "lecturer" ? "Mã giảng viên:" : "Mã sinh viên:"}
              </label>
              <input
                type="text"
                id="userId"
                value={user.role === "lecturer" ? (user.lecturer_code || "-") : (user.student_code || "-")}
                className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent"
                readOnly
              />
            </div>
          )}

          <div className="flex flex-row items-center gap-2">
            <label
              htmlFor="fullName"
              className="text-gray-700 font-medium flex-shrink-0"
            >
              Họ tên:
            </label>
            <input
              type="text"
              id="fullName"
              value={user.full_name}
              className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent"
              readOnly
            />
          </div>

          

          <div className="flex flex-row items-center gap-2">
            <label
              htmlFor="phone"
              className="text-gray-700 font-medium flex-shrink-0"
            >
              CCCD:
            </label>
            <input
              type="text"
              id="phone"
              value={user.citizen_id_card || "-"}
              className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent"
              readOnly
            />
          </div>

          <div className="flex flex-row items-center gap-2">
            <label
              htmlFor="phone"
              className="text-gray-700 font-medium flex-shrink-0"
            >
              Dân tộc:
            </label>
            <input
              type="text"
              id="phone"
              value={user.ethnic || "-"}
              className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent"
              readOnly
            />
          </div>

          <div className="flex flex-row items-center gap-2">
            <label
              htmlFor="phone"
              className="text-gray-700 font-medium flex-shrink-0"
            >
              Số điện thoại:
            </label>
            <input
              type="text"
              id="phone"
              value={user.phone || "-"}
              className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent"
              readOnly
            />
          </div>

          <div className="flex flex-row items-center gap-2">
            <label
              htmlFor="phone"
              className="text-gray-700 font-medium flex-shrink-0"
            >
              Email:
            </label>
            <input
              type="text"
              id="phone"
              value={user.email || "-"}
              className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent"
              readOnly
            />
          </div>
          {user.role === "student" && (
            <>
              <div className="flex flex-row items-center gap-2">
                <label className="text-gray-700 font-medium flex-shrink-0">Ngày sinh:</label>
                <input
                  type="text"
                  value={(user.student_date_of_birth || "").slice(0,10) || "-"}
                  className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent"
                  readOnly
                />
              </div>
             
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-y-6 mt-6">
          <div className="flex flex-row items-center gap-2">
            <label
              htmlFor="email"
              className="text-gray-700 font-medium flex-shrink-0"
            >
              Địa chỉ:
            </label>
            <input
              type="text"
              id="email"
              value={user.address || "-"}
              className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent"
              readOnly
            />
          </div>
          {user.role === "student" && (
            <>   
              <div className="flex flex-row items-center gap-2">
                <label className="text-gray-700 font-medium flex-shrink-0">Địa chỉ liên hệ:</label>
                <input
                  type="text"
                  value={user.student_contact_address || "-"}
                  className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent"
                  readOnly
                />
              </div>
            </>
          )}
        </div>
    </div>
  );
}
