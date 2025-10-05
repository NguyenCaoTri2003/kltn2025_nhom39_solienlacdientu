"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  GraduationCap,
  Users,
  BookOpen,
} from "lucide-react";
import WeeklyScheduleList from "@/components/lecturer/classes/weekly-schedule-list";
import CourseOfferingSkeleton from "@/components/skeleton/course-offering-skeleton";
import PracticeGroupCard from "./practice-group-card";

/* -------------------- Types -------------------- */
interface User {
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string | null;
}

interface Student {
  id: number;
  student_code: string;
  academic_year: string;
  training_level: string;
  academic_status: string;
  type_of_tranning: string;
  users: User;
}

interface Enrollment {
  id: number;
  registered_at: string;
  students: Student;
}

interface PracticeGroupStudent {
  id: number;
  enrollment_id: number;
  group_id: number;
  assigned_at: string;
}

interface PracticeGroup {
  schedule: any;
  capacity: string;
  lecturers: any;
  id: number;
  group_number: number;
  lecturer_id: number;
  students: PracticeGroupStudent[];
}

interface OfferingDetail {
  id: number;
  name: string;
  class_code: string;
  capacity: number;
  registered: number;
  practice_group_count: number;
  courses?: {
    course_code: string;
    credit: number;
  };
  weekly_schedules: any[];
  students: Enrollment[];
  practice_groups?: PracticeGroup[];
}

/* -------------------- Helpers -------------------- */
// Lấy danh sách sinh viên từ 1 group (dựa vào enrollment_id)
function mapGroupStudents(
  group: PracticeGroup,
  enrollments: Enrollment[]
): Student[] {
  return group.students
    .map((gs) => {
      const found = enrollments.find((e) => e.id === gs.enrollment_id);
      return found?.students;
    })
    .filter((s): s is Student => !!s);
}

/* -------------------- Component -------------------- */
export default function ClassDetail() {
  const params = useParams();
  const { id } = params;

  const [offering, setOffering] = useState<OfferingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/course-offerings/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const json = await res.json();
        setOffering(json.returnCode === 0 ? json.data : null);
      } catch (error) {
        console.error("Error fetching class detail:", error);
        setOffering(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) return <CourseOfferingSkeleton items={1} />;
  if (!offering)
    return (
      <div className="text-center py-12 text-muted-foreground">
        Không tìm thấy lớp học phần.
      </div>
    );

  return (
    <div className="space-y-10">
      {/* Thông tin lớp */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">
            {offering.name}
          </h2>
        </div>
        <p className="text-muted-foreground">Mã lớp: {offering.class_code}</p>
        <p className="text-muted-foreground">
          Mã học phần: {offering.courses?.course_code}
        </p>
        <div className="flex justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <GraduationCap className="w-4 h-4 text-primary" />
            {offering.courses?.credit || "-"} tín chỉ
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-primary" />
            {offering.registered}/{offering.capacity} SV
          </div>
        </div>
        <WeeklyScheduleList
          schedules={offering.weekly_schedules}
          filterType="theory"
        />
      </Card>

      {/* Danh sách nhóm thực hành */}
      {offering.practice_group_count > 0 &&
        offering.practice_groups &&
        offering.practice_groups.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            {offering.practice_groups.map((g) => (
              <PracticeGroupCard
                key={g.id}
                groupNumber={g.group_number}
                lecturerName={g.lecturers?.users?.full_name}
                lecturerCode={g.lecturers?.lecturer_code}
                lecturerEmail={g.lecturers?.users?.email}
                studentCount={g.students?.length || 0}
                capacity={g.capacity ? Number(g.capacity) : undefined}
                schedule={g.schedule}
              />
            ))}
          </div>
        )}

      {/* Danh sách sinh viên */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Danh sách sinh viên</h3>

        {offering.practice_group_count > 0 &&
          offering.practice_groups &&
          offering.practice_groups.length > 0 ? (
          <Tabs defaultValue="theory">
            <TabsList>
              <TabsTrigger value="theory">Lý thuyết</TabsTrigger>
              {offering.practice_groups.map((g) => (
                <TabsTrigger key={g.id} value={`group-${g.group_number}`}>
                  Nhóm {g.group_number}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Lý thuyết = tất cả sinh viên */}
            <TabsContent value="theory">
              <StudentTable
                students={offering.students.map((e) => e.students)}
              />
            </TabsContent>

            {/* Các nhóm */}
            {offering.practice_groups.map((g) => (
              <TabsContent key={g.id} value={`group-${g.group_number}`}>
                <StudentTable students={mapGroupStudents(g, offering.students)} />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <StudentTable students={offering.students.map((e) => e.students)} />
        )}
      </section>
    </div>
  );
}

/* -------------------- Sub Component -------------------- */
function StudentTable({ students }: { students: Student[] }) {
  if (!students || students.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-6">
        Chưa có sinh viên.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Mã SV</TableHead>
          <TableHead>Họ và tên</TableHead>
          <TableHead>Email</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((s) => (
          <TableRow key={s.id}>
            <TableCell>{s.student_code}</TableCell>
            <TableCell>{s.users.full_name}</TableCell>
            <TableCell>{s.users.email || "-"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
