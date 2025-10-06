import { Parent } from "./Parent";

export interface StudentParent {
  student_id: number;
  parent_id: number;
  relationship?: string;
  parents?: Parent;
}