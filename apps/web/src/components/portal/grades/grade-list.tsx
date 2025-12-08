"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/user-context";
import GradeContent from "./grade-content";
import Loading from "@/components/ui/loading";

export default function GradesList() {
  const { userData } = useUser();
  const isParent = userData?.role === "parent";
  const children = userData?.children || [];

  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  useEffect(() => {
    if (!userData) return;
    if (selectedStudentId) return; 

    if (isParent && children.length > 0) {
      setSelectedStudentId(children[0].id);
    } else if (userData?.student?.id) {
      setSelectedStudentId(userData.student.id);
    }
  }, [userData, isParent, children, selectedStudentId]);

  const activeChild = useMemo(() => {
    return isParent
      ? children.find((c: any) => c.id === selectedStudentId)
      : null;
  }, [isParent, children, selectedStudentId]);

  const studentYear = useMemo(() => {
    const yearStr = isParent
      ? activeChild?.academic_year
      : userData?.student?.academic_year;

    return yearStr ? parseInt(yearStr.split(" - ")[0]) : null;
  }, [isParent, activeChild, userData]);

  console.log("Selected Student ID:", selectedStudentId);

  if (!userData)
    return (
      <Loading text="Đang tải dữ liệu..." />
    );

  return (
    <div className="space-y-6">

      {isParent && children.length > 0 && (
        <div className="flex flex-wrap gap-2 bg-indigo-50 p-2 rounded-lg">
          {children.map((child: any) => (
            <button
              key={child.id}
              className={`cursor-pointer px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${selectedStudentId === child.id
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300"
                }`}
              onClick={() => setSelectedStudentId(child.id)}
            >
              {child.users?.full_name}
            </button>
          ))}
        </div>
      )}

      {selectedStudentId && studentYear && (
        <GradeContent
          key={selectedStudentId}
          studentId={selectedStudentId}
          studentYear={studentYear}
        />
      )}
    </div>
  );
}
