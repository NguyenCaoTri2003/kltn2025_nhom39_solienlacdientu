export interface CourseOffering {
    id: number;              // bigint, PK
    course_id: number;       // FK -> courses.id
    lecturer_id?: number;    // FK -> lecturers.id (có thể null)
    name?: string;           // tên lớp học phần (nếu có)
    class_code: string;      // mã lớp học phần, unique
    capacity?: number;       // sức chứa tối đa
    registered?: number;     // số đã đăng ký
    status: string;          // USER-DEFINED (enum trong DB)
    schedule?: string;       // thông tin lịch (chuỗi mô tả)
    description?: string;    // mô tả lớp học phần
  }
  