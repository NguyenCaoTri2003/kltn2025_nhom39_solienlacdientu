import { Major } from "./Majors";


export type Faculty = {
    id: number;                 // bigserial 
    name: string;               // varchar(128)
    faculty_code: string;       // varchar(20)
    description?: string | null;// varchar(255), có thể null
};

export type FacultyWithMajors = Faculty & {
    majors: Major[];  // tham chiếu sang type Major
};

