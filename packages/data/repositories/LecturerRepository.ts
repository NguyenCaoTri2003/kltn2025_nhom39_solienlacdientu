import { supabase } from "../supabaseClient";

export class LecturerRepository {
  async getLecturersBySemester(semesterId: number) {
    try {
      console.log("Getting lecturers for semester:", semesterId);
      
      // Bước 1: Lấy tất cả course_offerings có courses thuộc semester này
      const { data: offerings, error: offeringsError } = await supabase
        .from("course_offerings")
        .select(`
          lecturer_id,
          courses:course_id (
            semester_id
          )
        `)
        .not("lecturer_id", "is", null)
        .eq("courses.semester_id", semesterId);

      if (offeringsError) {
        console.error("Offerings database error:", offeringsError);
        throw offeringsError;
      }

      console.log("Offerings result:", offerings);

      if (!offerings || offerings.length === 0) {
        return [];
      }

      // Bước 2: Lấy danh sách unique lecturer_ids
      const lecturerIds = Array.from(new Set(offerings.map(o => o.lecturer_id).filter(id => id)));
      console.log("Unique lecturer IDs:", lecturerIds);

      if (lecturerIds.length === 0) {
        return [];
      }

      // Bước 3: Lấy thông tin chi tiết của các lecturers
      const { data: lecturers, error: lecturersError } = await supabase
        .from("lecturers")
        .select(`
          id,
          lecturer_code,
          academic_rank,
          users (
            id,
            full_name,
            email,
            phone,
            role
          )
        `)
        .in("id", lecturerIds);

      if (lecturersError) {
        console.error("Lecturers database error:", lecturersError);
        throw lecturersError;
      }

      console.log("Lecturers result:", lecturers);
      return lecturers ?? [];
    } catch (err) {
      console.error("Lecturer repository error:", err);
      throw err;
    }
  }
}
