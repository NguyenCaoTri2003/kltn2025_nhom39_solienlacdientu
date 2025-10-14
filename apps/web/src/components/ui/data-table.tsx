"use client";

import { ReactNode } from "react";

interface DataTableProps {
  headers: string[];
  children: ReactNode;
  maxHeight?: string;
  maxWidth?: string;
}

export function DataTable({
  headers,
  children,
  maxHeight = "400px",
  maxWidth = "100%",
}: DataTableProps) {
  return (
    <div
      className="relative border rounded-xl shadow-sm bg-white overflow-hidden"
      style={{ maxWidth }}
    >
      {/* Khung cuộn luôn hiển thị */}
      <div
        className="overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        style={{
          maxHeight,
          overflowX: "scroll",
          overflowY: "scroll",
        }}
      >
        <table className="min-w-full text-sm text-left border-collapse">
          <thead className="bg-gray-50 text-gray-700 sticky top-0 z-10">
            <tr>
              {headers.map((h, idx) => (
                <th key={idx} className="px-4 py-3 border-b whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}
