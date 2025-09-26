export interface Course {
    id: number; // bigserial -> number
    name: string; // varchar(128) not null
    course_code: string; // varchar(20) not null
    tuition_fee?: number | null; // numeric(18,2) có thể null
    credit?: number | null; // integer có thể null
    description?: string | null; // varchar(255) có thể null
    has_practice?: boolean | null; // boolean, default false
    semester_id?: number | null; // bigint có thể null
    major_id?: number | null; // bigint có thể null
  }
  