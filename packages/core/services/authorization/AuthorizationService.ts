import { supabase } from "@/data/supabaseClient";

export class AuthorizationService {
    static async canViewStudent(user: any, studentId: number): Promise<boolean> {
        if (user.role === "student") {
            return user.id === studentId;
        }

        if (user.role === "parent") {
            const { data } = await supabase
                .from("student_parent")
                .select("student_id")
                .eq("parent_id", user.id)
                .eq("student_id", studentId)
                .maybeSingle();
            return !!data;
        }

        if (user.role === "admin" || user.role === "lecturer") {
            return true;
        }

        return false;
    }

    static async canViewOfferingGrades(user: any, offeringId: number): Promise<boolean> {
        if (user.role === "lecturer") {
            const { data: theory } = await supabase
                .from("course_offerings")
                .select("id")
                .eq("id", offeringId)
                .eq("lecturer_id", user.id)
                .maybeSingle();

            if (theory) return true;

            const { data: practice } = await supabase
                .from("practice_groups")
                .select("id")
                .eq("lecturer_id", user.id)
                .eq("offering_id", offeringId) 
                .maybeSingle();

            if (practice) return true;

            return false;
        }

        return user.role === "admin";
    }

    

}
