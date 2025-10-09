import { User } from "./Users";

export interface Parent {
  id: number;
  occupation?: string;
  address?: string;
  phone?: string;
  email?: string;
  relation: string;
  name: string;
  users?: User;
}