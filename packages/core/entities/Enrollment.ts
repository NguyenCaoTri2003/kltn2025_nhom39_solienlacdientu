export interface Enrollment {
    id: number;
    student_id: string;
    offering_id: number;
    status: 'enrolled' | 'completed' | 'dropped';
    final_score: number | null;
    created_at: string;
    updated_at: string;
}