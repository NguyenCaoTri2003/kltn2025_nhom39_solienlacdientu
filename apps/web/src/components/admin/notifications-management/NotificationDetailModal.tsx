"use client";
import Image from "next/image";

export type NotificationDetail = {
  id: number;
  title: string | null;
  content: string | null;
  type: "university" | "lecturer" | "system" | null;
  category: string | null;
  created_at?: string;
  url?: string | null;
};

interface NotificationDetailModalProps {
  open: boolean;
  onClose: () => void;
  item: NotificationDetail | null;
}

export function NotificationDetailModal({ open, onClose, item }: NotificationDetailModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl mx-4 rounded-xl bg-white border border-border shadow-lg">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Chi tiết thông báo</h3>
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm">Đóng</button>
        </div>
        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto space-y-3">
          <Field label="Tiêu đề" value={item?.title || "(Không tiêu đề)"} />
          <Field label="Nội dung" value={item?.content || "-"} multiline />
          <Field label="Loại" value={item?.type || "-"} />
          <Field label="Danh mục" value={item?.category || "-"} />
          <Field label="Thời gian" value={item?.created_at ? new Date(item.created_at).toLocaleString("vi-VN") : "-"} />

          {item?.url ? (
            <div className="pt-2">
              <div className="text-gray-700 font-medium mb-2">Ảnh đính kèm:</div>
              <div className="border rounded-md overflow-hidden max-h-[360px] flex items-center justify-center bg-muted">
                <Image
                  src={item.url}
                  alt="attachment"
                  width={800}
                  height={600}
                  unoptimized
                  style={{ width: "100%", height: "auto", maxHeight: 360, objectFit: "contain" }}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="flex flex-row items-start gap-2">
      <label className="text-gray-700 font-medium flex-shrink-0 min-w-[140px]">{label}:</label>
      {multiline ? (
        <div className="flex-1 text-gray-800 whitespace-pre-wrap break-words">{value}</div>
      ) : (
        <input type="text" readOnly value={value} className="flex-1 bg-transparent text-gray-800 focus:outline-none border-b-2 border-transparent" />
      )}
    </div>
  );
}

