import { Student } from "./Student";

export interface Enrollment {
    map(arg0: (e: any) => any): unknown;
    user: any;
    id: number;
    student_id: string;
    offering_id: number;
    status: 'enrolled' | 'completed' | 'dropped';
    final_score: number | null;
    created_at: string;
    updated_at: string;
    students?: Student;
}