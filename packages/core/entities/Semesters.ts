export interface Semester {
    id: number; // bigserial -> number
    name: string; // varchar(128) not null
    academic_year: string; // varchar(20) not null
}
  