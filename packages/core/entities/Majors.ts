import { Class } from "./Classes";
import { Faculty } from "./Faculties";

export type Major = {
    id: number;
    name: string;
    major_code: string;
    description?: string | null;
    faculty_id: number;
    faculty?: Faculty;
};

export type MajorWithClasses = Major & {
    classes: Class[]; 
};