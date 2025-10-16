export interface Appointment {
  id: number;
  title: string;
  content: string;
  start_time: string;
  end_time: string;
  location: string | null;
  status: string;
  parent: { users: { full_name: string } } | null;
  student: { users: { full_name: string } } | null;
}