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
      .select("id, lecturer_id")
      .eq("id", offeringId)
      .single()

    if (error) throw error
    return data
  }
}
