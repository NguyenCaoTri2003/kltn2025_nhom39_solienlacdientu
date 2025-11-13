import { supabase } from "../supabaseClient"

export class StudentRepository {
  async getStudentInOffering(offeringId: number, studentId: number) {
    const { data, error } = await supabase
      .from("enrollment")
      .select(`
        id,
        students:student_id (
          id,
          student_code,
          date_of_birth,
          place_of_birth,
          contact_address,
          class_id,
          classes:class_id (
            id,
            name
          ),
          academic_status,
          type_of_tranning,
          training_level,
          academic_year,
          place_of_birth,
          users (
            id,
            full_name,
            phone,
            email,
            avatar_url,
            citizen_id_card,
            ethnic, 
            avatar_url
          ),
          student_parent (
            relationship,
            parents:parent_id (
              id,
              occupation,
              users (
                id,
                full_name,
                phone,
                email
              )
            )
          )
        ),
        course_offerings:offering_id (
          id,
          name,
          class_code,
          lecturer_id
        )
      `)
      .eq("offering_id", offeringId)
      .eq("student_id", studentId)
      .maybeSingle();

    if (error) throw error
    return data
  }

  async getOfferingLecturer(offeringId: number) {
    const { data, error } = await supabase
      .from("course_offerings")
      .select("id, lecturer_id, name")
      .eq("id", offeringId)
      .single()

    if (error) throw error
    return data
  }

  async getPracticeGroupsByOfferingAndLecturer(offeringId: number, lecturerId: number) {
    const { data, error } = await supabase
      .from("practice_groups")
      .select("*")
      .eq("offering_id", offeringId)
      .eq("lecturer_id", lecturerId);

    if (error) throw error;
    return data;
  }

  //Lấy danh sách sinh viên (id, student_code, full_name, class_name, faculty_name, academic_status)
  async getListStudent() {
    const { data, error } = await supabase
      .from("students")
      .select(`
        id,
        student_code,
        academic_status,
        classes:class_id (
          id,
          class_code,
          name,
          majors:major_id (
            id,
            faculties:faculty_id (
              id,
              name
            )
          )
        ),
        users (
          id,
          full_name
        )
      `);

    if (error) throw error;
    const students = data.map((item: any) => ({
      id: item.id,
      student_code: item.student_code,
      full_name: item.users?.full_name || "",
      class_name: item.classes?.name || "",
      class_code: item.classes?.class_code || "",
      faculty_name:
        item.classes?.majors?.faculties?.name || "",
      academic_status: item.academic_status || "",
    }));

    return students;
  }

  async getStudentGPAById(studentId: string) {
    const { data: enrolls, error: enrollErr } = await supabase
      .from("enrollment")
      .select(`
        id,
        students:student_id ( student_code ),
        course_offerings:offering_id ( course:course_id ( id, credit, semester_id ) )
      `)
      .eq("student_id", studentId);
    if (enrollErr) throw enrollErr;
    if (!enrolls || enrolls.length === 0) return null;

    type EnrollRow = {
      id: number;
      students?: { student_code?: string | null } | null;
      course_offerings?: { course?: { id?: number | null; credit?: number | null; semester_id?: number | null } | null } | null;
    };
    const rows = enrolls as unknown as EnrollRow[];

    const semesterIds = rows
      .map((r) => r.course_offerings?.course?.semester_id)
      .filter((s): s is number => typeof s === "number");
    const latestSemesterId = semesterIds.length ? Math.max(...semesterIds) : null;
    if (!latestSemesterId) return null;

    const latestEnrollments = rows.filter((r) => r.course_offerings?.course?.semester_id === latestSemesterId);
    const latestEnrollmentIds = latestEnrollments.map((r) => r.id);
    if (latestEnrollmentIds.length === 0) return null;

    const { data: summaries, error: sumErr } = await supabase
      .from("grade_summary")
      .select("enrollment_id, gpa4, total_score")
      .in("enrollment_id", latestEnrollmentIds);
    if (sumErr) throw sumErr;
    if (!summaries || summaries.length === 0) return null;

    const creditMap = new Map<number, number>();
    latestEnrollments.forEach((r) => {
      const credit = r.course_offerings?.course?.credit ?? 0;
      creditMap.set(r.id, Number(credit) || 0);
    });

    let numerator = 0;
    let denominator = 0;
    summaries.forEach((s: any) => {
      const g = typeof s.gpa4 === "number" ? s.gpa4 : null;
      const cr = creditMap.get(s.enrollment_id) ?? 0;
      if (g != null && cr > 0) {
        numerator += g * cr;
        denominator += cr;
      }
    });

    const gpa = denominator > 0 ? Number((numerator / denominator).toFixed(2)) : null;

    return {
      student_id: studentId,
      student_code: rows[0]?.students?.student_code || "",
      semester_id: latestSemesterId,
      gpa,
    };
  }



  async getStudentParents(studentId: number): Promise<Array<{ parent_id: number; full_name: string; email: string }>> {
    const { data, error } = await supabase
      .from("student_parent")
      .select(`
        parent_id,
        parents:parent_id (
          id,
          users (
            id,
            full_name,
            email
          )
        )
      `)
      .eq("student_id", studentId);
    if (error) throw error;
    type Row = {
      parent_id?: number | null;
      parents?: { id?: number | null; users?: { id?: number | null; full_name?: string | null; email?: string | null } | null } | null;
    };
    const rows = (data ?? []) as Row[];
    return rows
      .map((row) => ({
        parent_id: (row?.parents?.id ?? row?.parent_id) as number,
        full_name: row?.parents?.users?.full_name ?? "",
        email: row?.parents?.users?.email ?? "",
      }))
      .filter((x) => Number.isFinite(x.parent_id)) as Array<{ parent_id: number; full_name: string; email: string }>;
  }

}