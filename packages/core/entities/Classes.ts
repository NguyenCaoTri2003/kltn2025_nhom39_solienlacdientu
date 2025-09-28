export interface Class {
    id: number; // bigserial -> number
    name: string; // varchar(128) not null
    class_code: string; // varchar(20) not null
    academic_year?: string | null; // varchar(20) có thể null
    class_type: string; // varchar(20) not null
    major_id?: number | null; // bigint có thể null
    homeroom_teacher_id?: number | null; // bigint có thể null
  }


  