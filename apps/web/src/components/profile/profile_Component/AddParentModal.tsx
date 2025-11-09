"use client";

import React, { useState } from "react";
import { toast } from "sonner";

export type ParentFormData = {
  full_name: string;
  email: string;
  phone: string;
  citizen_id_card: string;
  address: string;
  ethnic: string;
  occupation: string;
  relationship: "father" | "mother" | "guardian";
};

export default function AddParentModal({
  open,
  onClose,
  onSubmit,
  submitting = false,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ParentFormData) => void | Promise<void>;
  submitting?: boolean;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [citizenId, setCitizenId] = useState("");
  const [address, setAddress] = useState("");
  const [ethnic, setEthnic] = useState("");
  const [occupation, setOccupation] = useState("");
  const [relationship, setRelationship] = useState<"father" | "mother" | "guardian">("father");

  if (!open) return null;

  const handleSubmit = async () => {
    // Validate required fields
    if (!fullName.trim()) {
      toast.error("Vui lòng nhập họ tên phụ huynh");
      return;
    }

    if (!phone.trim()) {
      toast.error("Vui lòng nhập số điện thoại");
      return;
    }

    const payload: ParentFormData = {
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      citizen_id_card: citizenId.trim(),
      address: address.trim(),
      ethnic: ethnic.trim(),
      occupation: occupation.trim(),
      relationship,
    };

    await onSubmit(payload);
  };

  const handleReset = () => {
    setFullName("");
    setEmail("");
    setPhone("");
    setCitizenId("");
    setAddress("");
    setEthnic("");
    setOccupation("");
    setRelationship("father");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      <div className="relative z-10 w-full max-w-2xl mx-4 rounded-xl bg-white border border-border shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-border sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-foreground">Thêm thông tin phụ huynh</h3>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Họ tên - Bắt buộc */}
            <div className="md:col-span-2">
              <label className="block text-gray-700 font-medium mb-1">
                Họ tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-gray-800 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-300 outline-none transition-colors"
                placeholder="Nhập họ tên phụ huynh"
              />
            </div>

            {/* Số điện thoại - Bắt buộc */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-gray-800 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-300 outline-none transition-colors"
                placeholder="Nhập số điện thoại"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-gray-800 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-300 outline-none transition-colors"
                placeholder="Nhập email"
              />
            </div>

            {/* CCCD/CMND */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">CCCD/CMND</label>
              <input
                type="text"
                value={citizenId}
                onChange={(e) => setCitizenId(e.target.value)}
                className="w-full px-3 py-2 text-gray-800 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-300 outline-none transition-colors"
                placeholder="Nhập số CCCD/CMND"
              />
            </div>

            {/* Quan hệ - Bắt buộc */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Quan hệ <span className="text-red-500">*</span>
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value as "father" | "mother" | "guardian")}
                className="w-full px-3 py-2 text-gray-800 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-300 outline-none transition-colors"
              >
                <option value="father">Cha</option>
                <option value="mother">Mẹ</option>
                <option value="guardian">Người giám hộ</option>
              </select>
            </div>

            {/* Nghề nghiệp */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">Nghề nghiệp</label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="w-full px-3 py-2 text-gray-800 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-300 outline-none transition-colors"
                placeholder="Nhập nghề nghiệp"
              />
            </div>

            {/* Địa chỉ */}
            <div className="md:col-span-2">
              <label className="block text-gray-700 font-medium mb-1">Địa chỉ</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-gray-800 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-300 outline-none transition-colors"
                placeholder="Nhập địa chỉ"
              />
            </div>

            {/* Dân tộc */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">Dân tộc</label>
              <input
                type="text"
                value={ethnic}
                onChange={(e) => setEthnic(e.target.value)}
                className="w-full px-3 py-2 text-gray-800 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-300 outline-none transition-colors"
                placeholder="Nhập dân tộc"
              />
            </div>
          </div>

        </div>

        {/* Nút hành động */}
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3 sticky bottom-0 bg-white">
          <button
            onClick={handleClose}
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-[#4e73df] text-white hover:bg-[#3a5ed7] transition disabled:opacity-60"
          >
            {submitting ? "Đang xử lý..." : "Thêm phụ huynh"}
          </button>
        </div>
      </div>
    </div>
  );
}

