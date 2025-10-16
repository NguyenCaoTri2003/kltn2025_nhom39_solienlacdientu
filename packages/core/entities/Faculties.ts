import { Major } from "./Majors";


export type Faculty = {
    id: number;                
    name: string;               
    faculty_code: string;      
    description?: string | null;
};

export type FacultyWithMajors = Faculty & {
    majors: Major[];  
};

