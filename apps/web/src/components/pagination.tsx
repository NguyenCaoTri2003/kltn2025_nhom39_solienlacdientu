"use client";

import React from "react";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";

interface PaginationProps {
    totalItems: number;
    pageSize?: number;
    currentPage: number;
    onChange: (page: number) => void;
    item?: string;
}

export default function Pagination({
    totalItems,
    pageSize = 12,
    currentPage,
    onChange,
    item
}: PaginationProps) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const end = Math.min(totalItems, currentPage * pageSize);
    const disabledPrev = currentPage <= 1;
    const disabledNext = currentPage >= totalPages;

    const btnBase =
        "p-2 rounded-md inline-flex items-center justify-center transition-all";
    const btnEnabled =
        "hover:bg-primary/10 hover:text-primary focus:ring-2 focus:ring-primary/40";
    const btnDisabled = "opacity-40 cursor-not-allowed";

    return (
        <div className="mt-8 grid grid-cols-3 items-center">
            <div className="text-sm text-muted-foreground">
                Hiển thị{" "}
                <span className="text-foreground font-medium">
                    {start}-{end}
                </span>{" "}
                / <span className="text-foreground font-medium">{totalItems}</span> {item}
            </div>

            <div className="flex justify-center items-center gap-2">
                <button
                    aria-label="Trang đầu"
                    className={`${btnBase} ${disabledPrev ? btnDisabled : btnEnabled
                        }`}
                    onClick={() => onChange(1)}
                    disabled={disabledPrev}
                >
                    <ChevronsLeft className="w-4 h-4" />
                </button>

                <button
                    aria-label="Trang trước"
                    className={`${btnBase} ${disabledPrev ? btnDisabled : btnEnabled
                        }`}
                    onClick={() => onChange(Math.max(1, currentPage - 1))}
                    disabled={disabledPrev}
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="px-4 py-1.5 rounded-md bg-accent/40 text-sm font-medium text-foreground shadow-sm">
                    Trang{" "}
                    <span className="text-primary font-semibold">{currentPage}</span> /{" "}
                    {totalPages}
                </div>

                <button
                    aria-label="Trang sau"
                    className={`${btnBase} ${disabledNext ? btnDisabled : btnEnabled
                        }`}
                    onClick={() => onChange(Math.min(totalPages, currentPage + 1))}
                    disabled={disabledNext}
                >
                    <ChevronRight className="w-4 h-4" />
                </button>

                <button
                    aria-label="Trang cuối"
                    className={`${btnBase} ${disabledNext ? btnDisabled : btnEnabled
                        }`}
                    onClick={() => onChange(totalPages)}
                    disabled={disabledNext}
                >
                    <ChevronsRight className="w-4 h-4" />
                </button>
            </div>

            <div />
        </div>

    );
}
