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
import { WeeklySchedule } from "@packages/core/entities/WeeklySchedule";
import { Semester } from "@packages/core/entities/Semesters";
import { Student } from "@packages/core/entities/Student";
import { Enrollment } from "@packages/core/entities/Enrollment";
import { PracticeGroup } from "@packages/core/entities/PracticeGroup";
import { Offering } from "@packages/core/entities/CourseOffering";

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

export default function ClassDetail() {
  const params = useParams();
  const { id } = params;

  const [offering, setOffering] = useState<Offering | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("theory");

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
      <Card
        className="p-5 md:p-6 rounded-2xl border border-border/50 
          bg-gradient-to-br from-card/95 to-card/70 shadow-md hover:shadow-lg 
          transition-all backdrop-blur-sm space-y-3 gap-1 cursor-pointer"
        onClick={() => setActiveTab("theory")}
      >

        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground leading-tight">
            {offering.name}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Mã lớp học phần:</span>{" "}
            {offering.class_code}
          </p>
          <p>
            <span className="font-medium text-foreground">Mã học phần:</span>{" "}
            {offering.courses?.course_code || "-"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Giảng viên:</span>{" "}
            {offering.lecturers?.users?.full_name || "Chưa phân công"}
          </p>
          <p>
            <span className="font-medium text-foreground">Học kỳ:</span>{" "}
            {offering.semesters?.name || "-"} {""} ({offering.semesters?.academic_year || "-"})
          </p>
        </div>

        <WeeklyScheduleList
          schedules={offering.weekly_schedules}
          filterType="theory"
          semester={offering.semesters ?? undefined}
        />

        <div className="flex justify-between text-sm text-muted-foreground border-t border-border/50 pt-3">
          <div className="flex items-center gap-1">
            <GraduationCap className="w-4 h-4 text-primary" />
            {offering.courses?.credit || "-"} tín chỉ
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-primary" />
            {offering.registered || 0}/{offering.capacity || 0} SV
          </div>
        </div>

        {offering.description && (
          <p className="text-sm text-muted-foreground italic">
            {offering.description}
          </p>
        )}
      </Card>

      {offering.practice_group_count > 0 &&
        offering.practice_groups &&
        offering.practice_groups.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            {offering.practice_groups.map((g) => (
              <div
                key={g.id}
                onClick={() => setActiveTab(`group-${g.group_number}`)}
                className="cursor-pointer"
              >
                <PracticeGroupCard
                  groupNumber={g.group_number}
                  lecturerName={g.lecturers?.users?.full_name}
                  lecturerCode={g.lecturers?.lecturer_code}
                  lecturerEmail={g.lecturers?.users?.email}
                  studentCount={g.students?.length || 0}
                  capacity={g.capacity ? Number(g.capacity) : undefined}
                  schedule={g.weekly_schedules}
                  semester={offering.semesters}
                />
              </div>
            ))}
          </div>
        )}

      <section>
        <h3 className="text-lg font-semibold mb-4">Danh sách sinh viên</h3>

        {offering.practice_group_count > 0 &&
          offering.practice_groups &&
          offering.practice_groups.length > 0 ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="theory">Lý thuyết</TabsTrigger>
              {offering.practice_groups.map((g) => (
                <TabsTrigger key={g.id} value={`group-${g.group_number}`}>
                  Nhóm {g.group_number}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="theory">
              <StudentTable
                students={offering.students.map((e) => e.students).filter((s): s is Student => !!s)}
              />
            </TabsContent>

            {offering.practice_groups.map((g) => (
              <TabsContent key={g.id} value={`group-${g.group_number}`}>
                <StudentTable students={mapGroupStudents(g, offering.students)} />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <StudentTable students={offering.students.map((e) => e.students).filter((s): s is Student => !!s)} />
        )}
      </section>
    </div>
  );
}

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
          <TableHead>Phụ huynh</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {students.map((s) => {
          const parents = s.student_parent?.map((sp) => ({
            name: sp.parents?.users?.full_name,
            phone: sp.parents?.users?.phone,
            relation: sp.relationship,
          })) ?? [];

          return (
            <TableRow key={s.id}>
              <TableCell>{s.student_code}</TableCell>
              <TableCell>{s.users?.full_name}</TableCell>
              <TableCell>{s.users?.email || "-"}</TableCell>
              <TableCell>
                {parents.length > 0 ? (
                  <div className="space-y-1">
                    {parents.map((p, i) => (
                      <div key={i} className="text-sm leading-tight">
                        <span className="font-medium text-foreground">
                          {p.relation === "father"
                            ? "Cha"
                            : "Mẹ"}{": "}
                        </span>
                        <span>{p.name}</span>
                        {p.phone && (
                          <span className="text-muted-foreground"> ({p.phone})</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">Không có</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
