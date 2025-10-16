import React from "react";
import { Badge } from "@/components/ui/badge";

interface AttendanceSummaryStatsProps {
  students: { id: number; studentCode: string; fullName: string }[];
  attendanceMap: Record<number, Record<string, any[]>>; // studentId -> date -> AttendanceRecord[]
  group: { key: string; groupId?: number; dates: string[] };
}

export const AttendanceSummaryStats: React.FC<AttendanceSummaryStatsProps> = ({
  students,
  attendanceMap,
  group,
}) => {
  if (!students || students.length === 0) return null;

  // Sinh viên có dữ liệu điểm danh
  const studentsWithAttendance = students.filter((s) => {
    const records = Object.values(attendanceMap[s.id] || {}).flat();
    return records.length > 0;
  });

  // Sinh viên chưa có dữ liệu
  const studentsWithoutAttendance = students.filter(
    (s) => !studentsWithAttendance.includes(s)
  );

  const totalStudents = studentsWithAttendance.length;

  // Thống kê số buổi của từng sinh viên
  const summaryList = studentsWithAttendance.map((s) => {
    const records = Object.values(attendanceMap[s.id] || {})
      .flat()
      .filter((r: any) =>
        group.key === "theory"
          ? r.type === "theory"
          : r.practice_group_id === group.groupId
      );

    const present = records.filter((r: any) => r.status === "present").length;
    const absent = records.filter((r: any) => r.status === "absent").length;
    const late = records.filter((r: any) => r.status === "late").length;
    const excused = records.filter((r: any) => r.status === "excused").length;

    return { student: s, present, absent, late, excused };
  });

  // Sinh viên vắng >= 3 buổi
  const absentMoreThan3 = summaryList.filter((s) => s.absent >= 3);

  return (
    <div className="mt-6 p-4 border rounded-lg bg-background space-y-3">
      <h4 className="text-lg font-semibold">Thống kê điểm danh</h4>

      <div>Số sinh viên có dữ liệu điểm danh: {totalStudents}</div>
      <div>Số sinh viên chưa có dữ liệu điểm danh: {studentsWithoutAttendance.length}</div>
      <div>Sinh viên vắng từ 3 buổi trở lên: {absentMoreThan3.length}</div>

      {absentMoreThan3.length > 0 && (
        <div className="mt-2">
          <strong>Danh sách sinh viên vắng ≥ 3 buổi:</strong>
          <ul className="list-disc list-inside mt-1">
            {absentMoreThan3.map((s) => (
              <li key={s.student.id}>
                {s.student.fullName} ({s.student.studentCode}) - {s.absent} buổi
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
