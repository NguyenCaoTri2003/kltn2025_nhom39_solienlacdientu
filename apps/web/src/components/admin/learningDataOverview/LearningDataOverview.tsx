"use client";

import { useState } from "react";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";

import Pagination from "@/components/pagination";

export default function LearningDataOverview() {
  const [searchText, setSearchText] = useState("");
  const [major, setMajor] = useState("");
  const [classroom, setClassroom] = useState("");
  const [semester, setSemester] = useState("");
  const [status, setStatus] = useState("");
  const [gpaRange, setGpaRange] = useState("");

  // mock data
  const grades = [
    {
      id: 1,
      studentCode: "SV001",
      fullName: "Nguyễn Văn A",
      className: "DHKTPM18A",
      semester: "Học kỳ 1 - 2024",
      gpa: 3.5,
      status: "Đạt",
    },
    {
      id: 2,
      studentCode: "SV002",
      fullName: "Trần Thị B",
      className: "DHKTPM18A",
      semester: "Học kỳ 1 - 2024",
      gpa: 1.9,
      status: "Cảnh báo",
    },
  ];

  const handleClearFilters = () => {
    setMajor("");
    setClassroom("");
    setSemester("");
    setStatus("");
    setGpaRange("");
    setSearchText("");
  };

  return (
    <div className="space-y-6">
      <PageBreadcrumb
        items={[
          { label: "Quản lý học tập", href: "/admin" },
          { label: "Bảng điểm tổng hợp" },
        ]}
      />

      {/* Bộ lọc tổng hợp */}
      <div className="border rounded-xl p-4 bg-white shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-gray-600" />
            Bộ lọc tìm kiếm
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-sm text-gray-600 hover:text-red-600"
          >
            Xóa bộ lọc
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Ngành */}
          <Select value={major} onValueChange={setMajor}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn ngành" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ktpm">Kỹ thuật phần mềm</SelectItem>
              <SelectItem value="cntt">Công nghệ thông tin</SelectItem>
              <SelectItem value="attt">An toàn thông tin</SelectItem>
            </SelectContent>
          </Select>

          {/* Lớp */}
          <Select value={classroom} onValueChange={setClassroom}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn lớp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dhktpm18a">DHKTPM18A</SelectItem>
              <SelectItem value="dhktpm18b">DHKTPM18B</SelectItem>
            </SelectContent>
          </Select>

          {/* Học kỳ */}
          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn học kỳ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hk1">Học kỳ 1 - 2024</SelectItem>
              <SelectItem value="hk2">Học kỳ 2 - 2024</SelectItem>
            </SelectContent>
          </Select>

          {/* Trạng thái học tập */}
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Trạng thái học tập" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dat">Đạt</SelectItem>
              <SelectItem value="canhbao">Cảnh báo học tập</SelectItem>
              <SelectItem value="truot">Trượt</SelectItem>
            </SelectContent>
          </Select>

          {/* Khoảng GPA */}
          <Select value={gpaRange} onValueChange={setGpaRange}>
            <SelectTrigger>
              <SelectValue placeholder="Khoảng điểm trung bình (GPA)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4">= 4.0</SelectItem>
              <SelectItem value="3">3.0 - 3.9</SelectItem>
              <SelectItem value="2">2.0 - 2.9</SelectItem>
              <SelectItem value="1">Dưới 2.0</SelectItem>
            </SelectContent>
          </Select>

          {/* Tên hoặc MSSV */}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Tìm theo tên hoặc MSSV..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {searchText && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchText("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button className="w-full sm:w-auto">
            <Search className="h-4 w-4 mr-2" />
            Tìm kiếm
          </Button>
        </div>
      </div>

      {/* Bảng điểm */}
      <div className="overflow-x-auto border rounded-xl shadow-sm bg-white">
        <DataTable
  headers={[
    "#",
    "MSSV",
    "Họ và tên",
    "Lớp",
    "Học kỳ",
    "GPA",
    "Trạng thái",
  ]}
  maxHeight="450px"
>
  {grades.map((g, i) => (
    <tr key={g.id} className="hover:bg-gray-50">
      <td className="px-4 py-3 border-b">{i + 1}</td>
      <td className="px-4 py-3 border-b">{g.studentCode}</td>
      <td className="px-4 py-3 border-b">{g.fullName}</td>
      <td className="px-4 py-3 border-b">{g.className}</td>
      <td className="px-4 py-3 border-b">{g.semester}</td>
      <td className="px-4 py-3 border-b font-medium">{g.gpa}</td>
      <td
        className={`px-4 py-3 border-b font-semibold ${
          g.status === "Cảnh báo" ? "text-red-500" : "text-green-600"
        }`}
      >
        {g.status}
      </td>
    </tr>
  ))}
</DataTable>
      </div>


    </div>
  );
}
