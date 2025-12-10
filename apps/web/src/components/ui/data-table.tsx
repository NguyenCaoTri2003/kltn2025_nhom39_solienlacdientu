"use client";

import { ReactNode } from "react";

interface DataTableProps {
  headers: ReactNode[];
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
  const noYScroll = maxHeight === "auto" || maxHeight === "none";
  return (
    <div
      className="relative border rounded-xl shadow-sm bg-white overflow-hidden dark:bg-card dark:border-border dark:shadow-none"
      style={{ maxWidth }}
    >
      {/* Khung cuộn luôn hiển thị */}
      <div
        className="overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-700 dark:scrollbar-track-gray-800"
        style={{
          ...(noYScroll ? {} : { maxHeight }),
          overflowX: "auto",
          overflowY: noYScroll ? "visible" : "auto",
        }}
      >
        <table className="min-w-full text-sm text-left border-collapse dark:text-foreground">
          <thead className="bg-gray-50 text-gray-700 sticky top-0 z-10 dark:bg-muted/20 dark:text-muted-foreground">
            <tr>
              {headers.map((h, idx) => (
                <th key={idx} className="px-4 py-3 border-b whitespace-nowrap dark:border-border">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="dark:divide-border">{children}</tbody>
        </table>
      </div>
    </div>
  );
}
