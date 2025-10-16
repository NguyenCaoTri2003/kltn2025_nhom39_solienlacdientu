import { Class } from "./Classes";

export type Major = {
    id: number;
    name: string;
    major_code: string;
    description?: string | null;
    faculty_id: number;
};

export type MajorWithClasses = Major & {
    classes: Class[]; 
};