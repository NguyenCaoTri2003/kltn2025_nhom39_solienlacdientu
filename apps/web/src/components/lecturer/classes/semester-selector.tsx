"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

export interface Semester {
  id: number;
  name: string;
  academic_year: string;
  start_date?: string;
  end_date?: string;
}

interface SemesterSelectorProps {
  onChange: (semester: Semester | null) => void;
}

export default function SemesterSelector({ onChange }: SemesterSelectorProps) {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/semesters`);
        const json = await res.json();

        if (json.returnCode === 0 && Array.isArray(json.data)) {
          const data: Semester[] = json.data;
          setSemesters(data);

          const today = new Date();

          // Tìm học kỳ hiện tại theo ngày
          const currentSemester = data.find((s) => {
            const start = s.start_date ? new Date(s.start_date) : null;
            const end = s.end_date ? new Date(s.end_date) : null;
            return start && end && today >= start && today <= end;
          });

          if (currentSemester) {
            setSelectedSemesterId(currentSemester.id);
            setSelectedYear(currentSemester.academic_year);
            onChange(currentSemester);
          } else if (data.length > 0) {
            // Nếu không có kỳ nào khớp ngày hiện tại thì chọn kỳ mới nhất
            const latest = data[data.length - 1];
            setSelectedSemesterId(latest.id);
            setSelectedYear(latest.academic_year);
            onChange(latest);
          }
        }
      } catch (error) {
        console.error("Error fetching semesters:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSemesters();
  }, [onChange]);

  // Lọc học kỳ theo năm học được chọn
  const filteredSemesters = semesters.filter(
    (s) => s.academic_year === selectedYear
  );

  return (
    <div className="flex flex-wrap gap-4">
      {/* Select Năm học */}
      <Select
        value={selectedYear || ""}
        onValueChange={(val: string) => {
          setSelectedYear(val);

          // Khi chọn năm học, tự chọn kỳ đầu tiên của năm đó
          const firstSemester = semesters.find(
            (s) => s.academic_year === val
          );
          if (firstSemester) {
            setSelectedSemesterId(firstSemester.id);
            onChange(firstSemester);
          } else {
            setSelectedSemesterId(null);
            onChange(null);
          }
        }}
        disabled={loading}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Chọn năm học" />
        </SelectTrigger>
        <SelectContent>
          {[...new Set(semesters.map((s) => s.academic_year))]
            .sort((a, b) => b.localeCompare(a))
            .map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      {/* Select Học kỳ */}
      <Select
        value={selectedSemesterId?.toString() || ""}
        onValueChange={(val: string) => {
          const semester = semesters.find((s) => s.id === Number(val)) || null;
          setSelectedSemesterId(Number(val));
          onChange(semester);
        }}
        disabled={!selectedYear || filteredSemesters.length === 0 || loading}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Chọn học kỳ" />
        </SelectTrigger>
        <SelectContent>
          {filteredSemesters.map((s) => (
            <SelectItem key={s.id} value={s.id.toString()}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
