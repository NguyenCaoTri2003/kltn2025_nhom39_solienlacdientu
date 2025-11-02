"use client";

import { useState, useMemo } from "react";
import { useUser } from "@/context/user-context";
import { useCourseOfferings } from "@/hooks/useCourseOfferings";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Pagination from "@/components/pagination";

const DAY_NAMES = [
  "Chủ nhật",
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
];

export default function OfferingsList() {
  const router = useRouter();
  const { userData } = useUser();

  const isParent = userData?.role === "parent";
  const children = userData?.children || [];
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const activeChild = isParent ? children[selectedChildIndex] : null;

  const studentId = isParent ? activeChild?.id : userData?.student?.id;
  const studentYear = isParent
    ? activeChild?.academic_year
    : userData?.student?.academic_year;

  const {
    semesters,
    semester,
    setSemester,
    offerings,
    loading,
    error,
    loadOfferingsBySemester,
  } = useCourseOfferings(studentYear, studentId);

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const handleSelectSemester = async (value: string) => {
    const selected = semesters.find((s) => s.id.toString() === value);
    if (selected) {
      setSemester(selected);
      await loadOfferingsBySemester(selected.id);
      setPage(1);
    }
  };

  const handleSearch = () => {
    if (!searchInput.trim()) return;
    setSearchTerm(searchInput.trim());
    setIsSearching(true);
    setPage(1);
  };

  const handleResetSearch = () => {
    setSearchInput("");
    setSearchTerm("");
    setIsSearching(false);
    setPage(1);
  };

  const filteredOfferings = useMemo(() => {
    if (!searchTerm) return offerings;
    const keyword = searchTerm.toLowerCase();
    return offerings.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.class_code.toLowerCase().includes(keyword)
    );
  }, [offerings, searchTerm]);

  const totalItems = filteredOfferings.length;
  const paginatedOfferings = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredOfferings.slice(start, start + pageSize);
  }, [filteredOfferings, page, pageSize]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      {/* Tabs chọn con (nếu là phụ huynh) */}
      {isParent && children.length > 1 && (
        <div className="flex gap-2 flex-wrap bg-indigo-50 p-2 rounded-lg">
          {children.map((child: any, index: number) => (
            <Button
              key={child.id}
              size="sm"
              variant={selectedChildIndex === index ? "default" : "outline"}
              onClick={() => setSelectedChildIndex(index)}
            >
              {child.users?.full_name || `Con ${index + 1}`}
            </Button>
          ))}
        </div>
      )}

      {/* Chọn học kỳ + Tìm kiếm */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-indigo-50/60 px-4 py-3 rounded-lg border border-indigo-100">
        <div>
          <p className="text-sm text-gray-600">Học kỳ hiện tại</p>
          <h2 className="text-lg font-semibold text-indigo-800">
            {semester
              ? `${semester.name} (${semester.academic_year})`
              : "Chưa chọn học kỳ"}
          </h2>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Ô tìm kiếm */}
          <div className="relative flex items-center">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Nhập tên hoặc mã lớp..."
              className="pl-9 pr-8 w-52"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Nút Tìm kiếm & Hoàn tác */}
          <div className="flex items-center gap-2">
            {!isSearching && searchInput.trim() && (
              <Button onClick={handleSearch} size="sm" className="gap-1">
                <Search className="w-4 h-4" /> Tìm kiếm
              </Button>
            )}

            {isSearching && (
              <Button
                onClick={handleResetSearch}
                variant="outline"
                size="sm"
                className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
              >
                <X className="w-4 h-4" /> Hoàn tác
              </Button>
            )}
          </div>

          {/* Chọn học kỳ */}
          <Select
            onValueChange={handleSelectSemester}
            value={semester ? semester.id.toString() : ""}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Chọn học kỳ" />
            </SelectTrigger>
            <SelectContent>
              {semesters.map((s) => (
                <SelectItem key={s.id} value={s.id.toString()}>
                  {s.name} - {s.academic_year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Danh sách lớp học phần */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-indigo-600">
          <Loader2 className="animate-spin w-6 h-6 mr-2" />
          <span>Đang tải lớp học phần...</span>
        </div>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : paginatedOfferings.length === 0 ? (
        <p className="text-center text-gray-500 py-10">
          Không có lớp học phần {isSearching ? "phù hợp" : "trong học kỳ này"}.
        </p>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            {paginatedOfferings.map((item) => {
              const theory = item.detail?.schedule?.[0];
              const practice = item.detail?.practice_group?.schedule?.[0];
              const hasPractice = !!item.detail?.practice_group;

              return (
                <Card
                  key={item.id}
                  className="p-5 bg-white border border-gray-200 hover:shadow-lg transition cursor-pointer rounded-xl"
                  onClick={() => router.push(`/portal/classes/${item.id}`)}
                >
                  <div className="mb-4">
                    <h3 className="font-bold text-xl text-gray-900">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Mã lớp:{" "}
                      <span className="font-medium">{item.class_code}</span>
                    </p>
                  </div>

                  <div
                    className={`grid gap-3 ${
                      hasPractice ? "md:grid-cols-2" : "grid-cols-1"
                    }`}
                  >
                    {/* Lý thuyết */}
                    <div className="bg-indigo-50/70 p-3 rounded-lg border border-indigo-100">
                      <h4 className="font-semibold text-indigo-800 mb-1">
                        Lý thuyết
                      </h4>
                      <p className="text-sm text-gray-700">
                        Giảng viên: {item.detail?.lecturer?.full_name ?? "—"}
                      </p>
                      {theory && (
                        <p className="text-sm text-gray-700">
                          {DAY_NAMES[theory.day_of_week]} — Tiết{" "}
                          {theory.start_period} -{" "}
                          {theory.start_period + theory.period_count - 1} | Phòng{" "}
                          {theory.classroom}
                        </p>
                      )}
                    </div>

                    {/* Thực hành */}
                    {hasPractice && (
                      <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-100">
                        <h4 className="font-semibold text-emerald-700 mb-1">
                          Thực hành
                        </h4>
                        <p className="text-sm text-gray-700">
                          Giảng viên:{" "}
                          {item.detail.practice_group.lecturer.full_name ?? "—"}
                        </p>
                        {practice && (
                          <p className="text-sm text-gray-700">
                            {DAY_NAMES[practice.day_of_week]} — Tiết{" "}
                            {practice.start_period} -{" "}
                            {practice.start_period +
                              practice.period_count -
                              1}{" "}
                            | Phòng {practice.classroom}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          <Pagination
            totalItems={totalItems}
            pageSize={pageSize}
            currentPage={page}
            onChange={handlePageChange}
            item="lớp học phần"
          />
        </>
      )}
    </div>
  );
}
