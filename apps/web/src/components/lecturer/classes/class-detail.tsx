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
import { StudentTable } from "./student-table";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { GradeTableCard } from "./grade-table-card";

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
  const [gradesData, setGradesData] = useState<any[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  console.log("offering", offering);

  const currentUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;

  const currentLecturerId = currentUser?.id;

  const isTheoryLecturer = offering?.lecturers?.id === currentLecturerId;

  const myPracticeGroup = offering?.practice_groups?.find(
    (g) => g.lecturers?.id === currentLecturerId
  );

  const isPracticeOnly = !isTheoryLecturer && !!myPracticeGroup;

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

  useEffect(() => {
    if (!id) return;
    const fetchGrades = async () => {
      setLoadingGrades(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/grades/lecturer?offering_id=${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const json = await res.json();
        console.log("Grades Response:", json);
        if (json.returnCode === 0) {
          let data = json.data;

          if (!isTheoryLecturer && myPracticeGroup) {
            data = data.filter(
              (g: any) => g.practice_group_number === myPracticeGroup.group_number
            );
          }

          setGradesData(data);
        } else {
          console.warn("Không lấy được điểm:", json.message);
        }
      } catch (error) {
        console.error("Error fetching grades:", error);
      } finally {
        setLoadingGrades(false);
      }
    };
    fetchGrades();
  }, [id, isTheoryLecturer, myPracticeGroup]);

  console.log("Grades Data:", gradesData);

  if (loading) return <CourseOfferingSkeleton items={1} />;
  if (!offering)
    return (
      <div className="text-center py-12 text-muted-foreground">
        Không tìm thấy lớp học phần.
      </div>
    );

  return (
    <div className="space-y-10">
      <PageBreadcrumb
        items={[
          { label: "Lớp học phần", href: "/lecturer/classes" },
          { label: offering.name }
        ]}
      />
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
          <p className="flex gap-1 items-center">
            <span className="font-medium text-foreground">Giảng viên:</span>{" "}
            <span className="single-ellipsis"> {offering.lecturers?.users?.full_name || "Chưa phân công"} {""} {offering.lecturers?.lecturer_code ? `(${offering.lecturers.lecturer_code})` : ""}</span>
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
                className={`cursor-pointer ${!isTheoryLecturer && myPracticeGroup?.id !== g.id
                  ? "opacity-60 pointer-events-none"
                  : ""
                  }`}
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
        {(offering.practice_groups?.length ?? 0) > 0 && !isPracticeOnly && offering.practice_groups && offering.practice_groups.length > 0 && (
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
                classId={offering.id}
                type="theory"
                enrollments={offering.students
                  .filter((e) => e.students !== undefined)
                  .map((e) => ({ id: e.id, students: e.students as Student }))}
                practiceGroups={offering.practice_groups ?? []}
                students={offering.students
                  .map((e) => e.students)
                  .filter((s): s is Student => !!s)}
              />
            </TabsContent>

            {offering.practice_groups.map((g) => (
              <TabsContent key={g.id} value={`group-${g.group_number}`}>
                <StudentTable
                  classId={offering.id}
                  type="practice"
                  enrollments={offering.students
                    .filter((e) => e.students !== undefined)
                    .map((e) => ({ id: e.id, students: e.students as Student }))
                  }
                  practiceGroups={offering.practice_groups ?? []}
                  students={mapGroupStudents(g, offering.students)}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}

        {isPracticeOnly && myPracticeGroup && (
          <Tabs value={`group-${myPracticeGroup.group_number}`}>
            <TabsList>
              <TabsTrigger disabled value={`group-${myPracticeGroup.group_number}`}>
                Nhóm {myPracticeGroup.group_number}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={`group-${myPracticeGroup.group_number}`}>
              <StudentTable
                classId={offering.id}
                type="practice"
                enrollments={offering.students
                  .filter((e) => e.students !== undefined)
                  .map((e) => ({ id: e.id, students: e.students as Student }))}
                practiceGroups={offering.practice_groups ?? []}
                students={mapGroupStudents(myPracticeGroup, offering.students)}
              />
            </TabsContent>
          </Tabs>
        )}

        {offering.practice_group_count === 0 && (
          <StudentTable
            classId={offering.id}
            type="theory"
            enrollments={offering.students
              .filter((e) => e.students !== undefined)
              .map((e) => ({ id: e.id, students: e.students as Student }))}
            practiceGroups={offering.practice_groups ?? []}
            students={offering.students
              .map((e) => e.students)
              .filter((s): s is Student => !!s)}
          />
        )}
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">Bảng điểm chi tiết của lớp học phần</h3>
        <GradeTableCard grades={gradesData} offeringName={offering.name} />
      </section>

    </div>
  );
}
