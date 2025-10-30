"use client";

import React, { useEffect, useState } from "react";

type EditFields = {
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  contact_address?: string | null;
};

export default function EditProfileModal({
  open,
  initial,
  onClose,
  onSubmit,
  submitting = false,
}: {
  open: boolean;
  initial?: EditFields;
  onClose: () => void;
  onSubmit: (data: Required<EditFields>) => void | Promise<void>;
  submitting?: boolean;
}) {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [contactAddress, setContactAddress] = useState("");

  useEffect(() => {
    if (open) {
      setPhone(initial?.phone ?? "");
      setEmail(initial?.email ?? "");
      setAddress(initial?.address ?? "");
      setContactAddress(initial?.contact_address ?? "");
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = async () => {
    const payload: Required<EditFields> = {
      phone,
      email,
      address,
      contact_address: contactAddress,
    };
    await onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg mx-4 rounded-xl bg-white border border-border shadow-lg">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Chỉnh sửa thông tin</h3>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-row items-center gap-2">
              <label className="text-gray-700 font-medium flex-shrink-0 min-w-[120px]">Số điện thoại</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent focus:border-blue-400"
              />
            </div>
            <div className="flex flex-row items-center gap-2">
              <label className="text-gray-700 font-medium flex-shrink-0 min-w-[120px]">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent focus:border-blue-400"
              />
            </div>
            <div className="flex flex-row items-center gap-2">
              <label className="text-gray-700 font-medium flex-shrink-0 min-w-[120px]">Địa chỉ</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent focus:border-blue-400"
              />
            </div>
            <div className="flex flex-row items-center gap-2">
              <label className="text-gray-700 font-medium flex-shrink-0 min-w-[120px]">Địa chỉ liên hệ</label>
              <input
                type="text"
                value={contactAddress}
                onChange={(e) => setContactAddress(e.target.value)}
                className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent focus:border-blue-400"
              />
            </div>
          </div>
          <span className="text-sm text-muted-foreground text-center italic">Vui lòng liên hệ Phòng Đào tạo để được hỗ trợ sửa các thông tin khác</span>
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition">
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-[#4e73df] text-white hover:bg-[#3a5ed7] transition disabled:opacity-60"
          >
            {submitting ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
      
    </div>
  );
}


