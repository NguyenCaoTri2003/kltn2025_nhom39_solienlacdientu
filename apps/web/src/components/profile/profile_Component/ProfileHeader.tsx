"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { getAvatarColor } from "@/utils/color-hash";
import { translateRole, translateAcademicRank } from "@packages/utils/translations";

interface ProfileHeaderProps {
  avatar_url?: string | null;
  displayName: string;
  role?: string;
  academic_rank?: string;
  faculty_name?: string;
  userId?: number | null;
  onEdit?: () => void;
}


export default function ProfileHeader({
  avatar_url,
  displayName,
  role,
  academic_rank,
  faculty_name,
  userId,
  onEdit,
}: ProfileHeaderProps) {
  const bgColor = useMemo(() => getAvatarColor(userId !== null && userId !== undefined ? String(userId) : displayName), [userId, displayName]);
  const initialLocal = useMemo(() => {
    const parts = (displayName || "").trim().split(" ");
    return parts[parts.length - 1]?.[0] ?? "?";
  }, [displayName]);

  return (
    <div className="mb-6">
      <div className="bg-card border border-border overflow-hidden rounded-xl dark:border-border/70 ">
        <div className="px-5 py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 ring-2 ring-border rounded-full overflow-hidden">
                {avatar_url ? (
                  <Image
                    src={avatar_url}
                    alt={displayName}
                    width={64}
                    height={64}
                    className="object-cover w-16 h-16"
                  />
                ) : (
                  <span
                    className={`${bgColor} w-full h-full flex items-center justify-center text-white text-2xl`}
                  >
                    {initialLocal}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-0.5 truncate max-w-[16rem]" title={displayName}>
                  {displayName}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                  {role && (
                    <span className="text-xs py-0.5 rounded-full">
                      {translateRole(role)}
                    </span>
                  )}
                  {role === "lecturer" && academic_rank && (
                    <>
                      <span className="opacity-60">•</span>
                      <span className="text-xs">{translateAcademicRank(academic_rank)}</span>
                    </>
                  )}
                  {faculty_name && (
                    <>
                      <span className="opacity-60">•</span>
                      <span className="text-xs">Khoa {faculty_name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {onEdit ? (
              <div className="w-full sm:w-auto">
                <button onClick={onEdit} className="px-4 py-2 rounded-lg bg-[#4e73df] text-white hover:bg-[#3a5ed7] transition  dark:bg-[#3a54b8] dark:hover:bg-[#2f47a3]">
                  Chỉnh sửa
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
