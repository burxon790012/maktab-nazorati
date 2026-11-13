import React from 'react';
import { Student } from '@/types';
import { AiHealthGuard } from './health/AiHealthGuard';

interface HealthTabProps {
  students: Student[];
  initialStudentId?: string;
}

export const HealthTab: React.FC<HealthTabProps> = ({ students, initialStudentId }) => {
  return <AiHealthGuard students={students} initialStudentId={initialStudentId} />;
};
