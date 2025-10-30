"use client";

import React from "react";

interface ProfileHeaderProps {
  avatar_url?: string | null;
  displayName: string;
  role?: string;
  academic_rank?: string;
  faculty_name?: string;
  initial?: string;
}

function translateRole(role?: string) {
  if (!role) return "";
  switch (role) {
    case "student": return "Sinh viên";
    case "parent": return "Phụ huynh";
    case "lecturer": return "Giảng viên";
    case "admin": return "Admin";
    default: return role;
  }
}
function translateAcademicRank(rank?: string) {
  if (!rank) return "";
  switch (rank) {
    case "master": return "Thạc sĩ";
    case "phd": return "Tiến sĩ";
    default: return rank;
  }
}

export default function ProfileHeader({
  avatar_url,
  displayName,
  role,
  academic_rank,
  faculty_name,
  initial
}: ProfileHeaderProps) {
  return (
    <div className="mb-6">
      <div className="bg-blue-50 border border-blue-300 overflow-hidden rounded-xl shadow">
        <div className="px-5 py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white ring-4 ring-blue-200 shadow-lg" style={{ background: avatar_url ? undefined : '#4e73df' }}>
                {avatar_url ? (
                  <img src={avatar_url} alt={displayName} className="w-full h-full object-cover rounded-full" />
                ) : (
                  initial || (displayName?.[0] ?? "?")
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-blue-700 mb-0.5 truncate max-w-[16rem]" title={displayName}>
                  {displayName}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-blue-800">
                  {role && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white">
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
          </div>
        </div>
      </div>
    </div>
  );
}
