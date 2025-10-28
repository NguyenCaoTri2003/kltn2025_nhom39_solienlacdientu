import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { useAcademicWarnings } from '../hooks/useAcademicWarnings';
import { AcademicWarning } from '../services/academicWarningService';

interface WarningDisplayProps {
  studentId: number;
  semesterId: number;
}

const WarningDisplay: React.FC<WarningDisplayProps> = ({ studentId, semesterId }) => {
  const [latestWarning, setLatestWarning] = useState<AcademicWarning | null>(null);
  const [loading, setLoading] = useState(true);
  const { getLatestWarningForSemester } = useAcademicWarnings();

  useEffect(() => {
    const loadWarning = async () => {
      try {
        setLoading(true);
        const warning = await getLatestWarningForSemester(studentId, semesterId);
        setLatestWarning(warning);
      } catch (error) {
        console.error('Error loading warning:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWarning();
  }, [studentId, semesterId, getLatestWarningForSemester]);

  if (loading) {
    return null;
  }

  if (!latestWarning) {
    return null;
  }

  const getWarningLevelColor = (level: string) => {
    switch (level) {
      case 'FIRST':
        return '#F59E0B';
      case 'SECOND':
        return '#EF4444';
      case 'FINAL':
        return '#DC2626'; 
      default:
        return '#6B7280'; 
    }
  };

  const getWarningLevelLabel = (level: string) => {
    switch (level) {
      case 'FIRST':
        return 'Cảnh báo lần 1';
      case 'SECOND':
        return 'Cảnh báo lần 2';
      case 'FINAL':
        return 'Cảnh báo lần 3';
      default:
        return 'Cảnh báo';
    }
  };

  return (
    <View style={styles.warningContainer}>
      <View style={styles.warningHeader}>
        <AlertCircle size={16} color={getWarningLevelColor(latestWarning.level)} />
        <Text style={styles.warningTitle}>Cảnh báo học vụ</Text>
      </View>
      <View style={styles.warningContent}>
        <View style={styles.warningRow}>
          <Text style={styles.warningLabel}>Mức độ:</Text>
          <Text style={[styles.warningValue, { color: getWarningLevelColor(latestWarning.level) }]}>
            {getWarningLevelLabel(latestWarning.level)}
          </Text>
        </View>
        <View style={styles.warningRow}>
          <Text style={styles.warningLabel}>Lý do:</Text>
          <Text style={styles.warningReason}>{latestWarning.reason}</Text>
        </View>
        <View style={styles.warningRow}>
          <Text style={styles.warningLabel}>Thời gian:</Text>
          <Text style={styles.warningDate}>
            {new Date(latestWarning.warned_at).toLocaleDateString('vi-VN')}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  warningContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 6,
  },
  warningContent: {
    gap: 4,
  },
  warningRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  warningLabel: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  warningValue: {
    fontSize: 12,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  warningReason: {
    fontSize: 12,
    color: '#374151',
    flex: 2,
    textAlign: 'right',
  },
  warningDate: {
    fontSize: 12,
    color: '#6B7280',
    flex: 2,
    textAlign: 'right',
  },
});

export default WarningDisplay;
