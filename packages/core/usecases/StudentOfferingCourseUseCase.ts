// import { StudentCourseRepository } from "@packages/data/repositories/StudentOfferingCourseRepository";

// type LecturerInfo = {
//   id: number;
//   code: string;
//   full_name: string;
//   email: string;
// };

// type WeeklySchedule = {
//   id: number;
//   day_of_week: string;
//   start_period: number;
//   period_count: number;
//   classroom: string;
//   building: string;
//   type: "theory" | "practice";
// };

// type CourseOffering = {
//   id: number;
//   name: string;
//   class_code: string;
//   capacity: number;
//   registered: number;
//   status: string;
//   description?: string;
//   lecturers?: {
//     id: number;
//     lecturer_code: string;
//     users: {
//       full_name: string;
//       email: string;
//     };
//   };
//   semesters?: any;
//   weekly_schedules?: WeeklySchedule[];
// };

// type PracticeGroup = {
//   id: number;
//   group_number: number;
//   capacity: number;
//   registered: number;
//   weekly_schedules?: WeeklySchedule[];
//   lecturers?: {
//     id: number;
//     lecturer_code: string;
//     users: {
//       full_name: string;
//       email: string;
//     };
//   };
// };

// type TheoryCourse = {
//   enrollment_id: number;
//   registered_at: string;
//   course_offering: CourseOffering;
// };

// type PracticeRecord = {
//   enrollment_id: number;
//   practice_groups: PracticeGroup;
// };

// export async function getOfferingsByStudent(
//   studentId: number,
//   semesterId?: number
// ) {
//   const repo = new StudentCourseRepository();

//   const theoryList: TheoryCourse[] = await repo.getTheoryCourses(
//     studentId,
//     semesterId
//   );

//   if (!theoryList.length) return [];

//   const enrollmentIds = theoryList.map((t) => t.enrollment_id);
//   const practiceList: PracticeRecord[] = await repo.getPracticeGroupsByEnrollments(
//     enrollmentIds
//   );

//   return theoryList.map((theory) => {
//     const offering = theory.course_offering;
//     const practice = practiceList.find(
//       (p) => p.enrollment_id === theory.enrollment_id
//     );

//     const theorySchedule = (offering.weekly_schedules ?? []).filter(
//       (s) => s.type === "theory"
//     );

//     const practiceSchedule =
//       practice?.practice_groups?.weekly_schedules?.filter(
//         (s) => s.type === "practice"
//       ) ?? [];

//     return {
//       enrollment_id: theory.enrollment_id,
//       registered_at: theory.registered_at,

//       course_offering: {
//         id: offering.id,
//         name: offering.name,
//         class_code: offering.class_code,
//         capacity: offering.capacity,
//         registered: offering.registered,
//         status: offering.status,
//         description: offering.description,
//         lecturer: offering.lecturers
//           ? {
//               id: offering.lecturers.id,
//               code: offering.lecturers.lecturer_code,
//               full_name: offering.lecturers.users.full_name,
//               email: offering.lecturers.users.email,
//             }
//           : null,
//         semester: offering.semesters,
//         schedule: theorySchedule,
//       },

//       practice_group: practice
//         ? {
//             id: practice.practice_groups.id,
//             group_number: practice.practice_groups.group_number,
//             capacity: practice.practice_groups.capacity,
//             registered: practice.practice_groups.registered,
//             schedule: practiceSchedule,
//             lecturer: practice.practice_groups.lecturers
//               ? {
//                   id: practice.practice_groups.lecturers.id,
//                   code: practice.practice_groups.lecturers.lecturer_code,
//                   full_name:
//                     practice.practice_groups.lecturers.users.full_name,
//                   email: practice.practice_groups.lecturers.users.email,
//                 }
//               : null,
//           }
//         : null,
//     };
//   });
// }

import { StudentCourseRepository } from "@packages/data/repositories/StudentOfferingCourseRepository";

export type LecturerInfo = {
  id: number;
  code: string;
  full_name: string;
  email: string;
};

export type WeeklySchedule = {
  id: number;
  day_of_week: string;
  start_period: number;
  period_count: number;
  classroom: string;
  building: string;
  type: "theory" | "practice";
};

export type SemesterInfo = {
  id: number;
  name: string;
  academic_year: string;
};

export type CourseOfferingLite = {
  id: number;
  name: string;
  class_code: string;
  status: string;
  semester: SemesterInfo;
  has_practice: boolean;
};

export type PracticeGroup = {
  id: number;
  group_number: number;
  capacity: number;
  registered: number;
  lecturer: LecturerInfo | null;
  schedule: WeeklySchedule[];
};

export type CourseOfferingDetail = {
  id: number;
  name: string;
  class_code: string;
  capacity: number;
  registered: number;
  status: string;
  description?: string;
  semester: SemesterInfo;
  lecturer: LecturerInfo | null;
  schedule: WeeklySchedule[];
  practice_group: PracticeGroup | null;
  course: {
    id: number;
    course_code: string;
    name: string;
    credit: number;
    tuition_fee: number;
    has_practice: boolean;
  } | null;
};

const toLecturer = (data: any): LecturerInfo | null =>
  data
    ? {
        id: data.id,
        code: data.lecturer_code,
        full_name: data.users.full_name,
        email: data.users.email,
      }
    : null;

type RawLecturer = {
  id: number;
  lecturer_code: string;
  users: { full_name: string; email: string };
};

type RawWeeklySchedule = {
  id: number;
  day_of_week: string;
  start_period: number;
  period_count: number;
  classroom: string;
  building: string;
  type: "theory" | "practice";
};

type RawSemester = {
  id: number;
  name: string;
  academic_year: string;
};

type RawCourseOffering = {
  courses: any;
  id: number;
  name: string;
  class_code: string;
  capacity: number;
  registered: number;
  status: string;
  description?: string;
  semesters: RawSemester;
  lecturers: RawLecturer | null;
  weekly_schedules: RawWeeklySchedule[];
};

type RawPracticeGroup = {
  id: number;
  group_number: number;
  capacity: number;
  registered: number;
  lecturers: RawLecturer | null;
  weekly_schedules: RawWeeklySchedule[];
};

type RawOfferingDetail = {
  course_offerings: RawCourseOffering | RawCourseOffering[]; 
  practice_enrollment?: { practice_groups: RawPracticeGroup }[];
};


export class StudentOfferingUseCase {
  private repo = new StudentCourseRepository();

  async getOfferingsLite(studentId: number, semesterId?: number) {
  const list = await this.repo.getStudentOfferingsLite(studentId, semesterId);

  const valid = (list ?? []).filter(
    (item: any) => item.course_offerings !== null
  );

  return valid.map((item: any): CourseOfferingLite => {
    const offering = item.course_offerings;
    return {
      id: offering.id,
      name: offering.name,
      class_code: offering.class_code,
      status: offering.status,
      semester: Array.isArray(offering.semesters)
        ? offering.semesters[0]
        : offering.semesters,
      has_practice: (item.practice_enrollment?.length ?? 0) > 0,
    };
  });
}

  async getOfferingDetail(
    studentId: number,
    offeringId: number
  ): Promise<CourseOfferingDetail | null> {
    const data = (await this.repo.getOfferingDetail(
      studentId,
      offeringId
    )) as unknown as RawOfferingDetail | null;

    if (!data) return null;

    const offering = Array.isArray(data.course_offerings)
      ? data.course_offerings[0]
      : data.course_offerings;

    const practice = data.practice_enrollment?.[0]?.practice_groups;

    return {
      id: offering.id,
      name: offering.name,
      class_code: offering.class_code,
      capacity: offering.capacity,
      registered: offering.registered,
      status: offering.status,
      description: offering.description,
      semester: offering.semesters,
      lecturer: toLecturer(offering.lecturers),

      course: offering.courses ? {
        id: offering.courses.id,
        course_code: offering.courses.course_code,
        name: offering.courses.name,
        credit: offering.courses.credit,
        tuition_fee: offering.courses.tuition_fee,
        has_practice: offering.courses.has_practice,
      } : null,

      schedule: (offering.weekly_schedules ?? []).filter(
        (s) => s.type === "theory"
      ),

      practice_group: practice
        ? {
            id: practice.id,
            group_number: practice.group_number,
            capacity: practice.capacity,
            registered: practice.registered,
            lecturer: toLecturer(practice.lecturers),
            schedule: (practice.weekly_schedules ?? []).filter(
              (s) => s.type === "practice"
            ),
          }
        : null,
    };
  }
}
