
export type RootStackParamList = {
  StudentHome: undefined;
  ParentHome: undefined;
  CourseOffering: undefined;
  CourseOfferingDetail: { id: number; studentId?: number };
  Grades: { studentId: number };
};