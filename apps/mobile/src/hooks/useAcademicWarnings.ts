import { useState, useEffect, useCallback } from 'react';
import { academicWarningService, AcademicWarning } from '../services/academicWarningService';

export interface UseAcademicWarningsReturn {
  warnings: AcademicWarning[];
  latestWarning: AcademicWarning | null;
  loading: boolean;
  error: string | null;
  loadWarnings: (studentId: number, semesterId?: number) => Promise<void>;
  getLatestWarningForSemester: (studentId: number, semesterId: number) => Promise<AcademicWarning | null>;
}

export function useAcademicWarnings(): UseAcademicWarningsReturn {
  const [warnings, setWarnings] = useState<AcademicWarning[]>([]);
  const [latestWarning, setLatestWarning] = useState<AcademicWarning | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWarnings = useCallback(async (studentId: number, semesterId?: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await academicWarningService.getStudentWarnings(studentId, semesterId);
      setWarnings(response.warnings);
      
      setLatestWarning(response.warnings.length > 0 ? response.warnings[0] : null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error loading academic warnings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getLatestWarningForSemester = useCallback(async (studentId: number, semesterId: number): Promise<AcademicWarning | null> => {
    try {
      return await academicWarningService.getLatestWarningForSemester(studentId, semesterId);
    } catch (err) {
      console.error('Error getting latest warning for semester:', err);
      return null;
    }
  }, []);

  return {
    warnings,
    latestWarning,
    loading,
    error,
    loadWarnings,
    getLatestWarningForSemester,
  };
}
