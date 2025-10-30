"use client";

import React from "react";

export interface BasicUserInfo {
  id: number;
  full_name: string;
  phone: string | null;
  email: string | null;
  citizen_id_card: string | null;
  address: string | null;
  ethnic: string | null;
}

export default function CommonInfoForm({ user }: { user: BasicUserInfo }) {

  return (
    <div>
        <h2 className="text-xl font-semibold text-[#4e73df] border-b-2 border-[#4e73df] pb-1 mb-8">
          Thông tin cá nhân
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
          <div className="flex flex-row items-center gap-2">
            <label
              htmlFor="userId"
              className="text-gray-700 font-medium flex-shrink-0"
            >
              Mã người dùng:
            </label>
            <input
              type="text"
              id="userId"
              defaultValue={user.id}
              className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent"
              readOnly
            />
          </div>

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
              defaultValue={user.full_name}
              className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent"
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
              defaultValue={user.citizen_id_card || "-"}
              className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent"
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
              defaultValue={user.ethnic || "-"}
              className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent"
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
              defaultValue={user.phone || "-"}
              className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent"
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
              defaultValue={user.email || "-"}
              className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent"
            />
          </div>
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
              defaultValue={user.address || "-"}
              className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent"
            />
          </div>
        </div>
    </div>
  );
}
