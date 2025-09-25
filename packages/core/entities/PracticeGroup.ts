export interface PracticeGroup {
    id: number;              // bigint, PK
    offering_id: number;     // FK -> course_offerings.id
    group_number: number;    // số thứ tự nhóm (bắt buộc)
    capacity?: number;       // sức chứa tối đa của nhóm
    registered?: number;     // số SV đã đăng ký
    schedule?: string;       // mô tả lịch thực hành
    lecturer_id?: number;    // GV phụ trách nhóm
}
  