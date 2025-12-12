export interface Appointment {
  id: number;
  title: string;
  content: string;
  start_time: string;
  end_time: string;
  location: string | null;
  status: string;
  from: string
  parent: { users: { full_name: string } } | null;
  student: { users: { full_name: string } } | null;
  lecturer: { users: { full_name: string } } | null;
  created_at: string;
  updated_at: string;
}