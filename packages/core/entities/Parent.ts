import { User } from "./Users";

export interface Parent {
  id: number;
  occupation?: string;
  users?: User;
}