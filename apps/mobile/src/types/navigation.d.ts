
export type RootStackParamList = {
  StudentHome: undefined;
  ParentHome: undefined;
  CourseOffering: undefined;
  CourseOfferingDetail: { id: number; studentId?: number };
  Grades: { studentId: number };
  Tuition: undefined;
  NotificationsList: undefined;
  NotificationDetail: { 
    notification: {
      id: number;
      content: string;
      type: string;
      category: string;
      created_at: string;
      warning_level?: string;
      url?: string | null;
      notifications?: {
        content: string;
        type: string;
        category: string;
        created_at: string;
        warning_level?: string;
        url?: string | null;
      };
    };
  };
};