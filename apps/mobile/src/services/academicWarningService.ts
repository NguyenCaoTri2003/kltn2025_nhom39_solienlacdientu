import { getAuthToken } from '../utils/auth';
import { API_URL } from '../constants/config';

const API_BASE_URL = API_URL || 'http://localhost:3000';

export interface AcademicWarning {
  id: number;
  student_id: number;
  semester_id: number;
  level: string;
  reason: string;
  warned_at: string;
}

export interface AcademicWarningsResponse {
  student_id: number;
  semester_id: number | null;
  total_warning: number;
  warnings: AcademicWarning[];
}

class AcademicWarningService {
  // Lấy danh sách cảnh báo của sinh viên
  async getStudentWarnings(studentId: number, semesterId?: number): Promise<AcademicWarningsResponse> {
    try {
      const token = await getAuthToken();
      const params = new URLSearchParams({
        studentId: studentId.toString(),
      });
      
      if (semesterId) {
        params.append('semesterId', semesterId.toString());
      }

      const response = await fetch(
        `${API_BASE_URL}/api/academic-warnings?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.returnCode !== 0) {
        throw new Error(data.message || 'Failed to fetch academic warnings');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching academic warnings:', error);
      throw error;
    }
  }

  // Lấy cảnh báo gần nhất của sinh viên trong học kỳ
  async getLatestWarningForSemester(studentId: number, semesterId: number): Promise<AcademicWarning | null> {
    try {
      const response = await this.getStudentWarnings(studentId, semesterId);
      return response.warnings.length > 0 ? response.warnings[0] : null;
    } catch (error) {
      console.error('Error fetching latest warning:', error);
      return null;
    }
  }
}

export const academicWarningService = new AcademicWarningService();
