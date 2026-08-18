export type CurriculumType = 'IGCSE' | 'IBMYP' | 'ICSE' | 'IBDP';

export interface CurriculumOption {
  id: CurriculumType;
  label: string;
  fullName: string;
  grades: string[];
  description: string;
  badgeColor: string;
}

export const CURRICULUM_CONFIGS: Record<CurriculumType, CurriculumOption> = {
  IGCSE: {
    id: 'IGCSE',
    label: 'IGCSE (Cambridge)',
    fullName: 'International General Certificate of Secondary Education',
    grades: ['FM 1', 'FM 2', 'FM 3', 'FM 4', 'FM 5'],
    description: 'Cambridge / Edexcel secondary curriculum (Classes FM 1 to FM 5)',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  IBMYP: {
    id: 'IBMYP',
    label: 'IB MYP (Middle Years)',
    fullName: 'International Baccalaureate Middle Years Programme',
    grades: ['MYP 1', 'MYP 2', 'MYP 3', 'MYP 4', 'MYP 5'],
    description: 'Inquiry-based framework for ages 11–16 (MYP 1 to MYP 5)',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  ICSE: {
    id: 'ICSE',
    label: 'ICSE (CISCE Board)',
    fullName: 'Indian Certificate of Secondary Education',
    grades: [
      'Grade 1',
      'Grade 2',
      'Grade 3',
      'Grade 4',
      'Grade 5',
      'Grade 6',
      'Grade 7',
      'Grade 8',
      'Grade 9',
      'Grade 10',
    ],
    description: 'Comprehensive Indian national syllabus (Grade 1 to Grade 10)',
    badgeColor: 'bg-amber-50 text-amber-900 border-amber-200',
  },
  IBDP: {
    id: 'IBDP',
    label: 'IB DP (Diploma Programme)',
    fullName: 'International Baccalaureate Diploma Programme',
    grades: ['IBDP 1', 'IBDP 2'],
    description: 'Rigorous pre-university academic curriculum (IBDP 1 & IBDP 2)',
    badgeColor: 'bg-purple-50 text-purple-900 border-purple-200',
  },
};

export const ALL_CURRICULA: CurriculumType[] = ['IGCSE', 'IBMYP', 'ICSE', 'IBDP'];

export function getGradesForCurriculum(curriculum?: string): string[] {
  if (!curriculum || !(curriculum in CURRICULUM_CONFIGS)) {
    return CURRICULUM_CONFIGS.IGCSE.grades;
  }
  return CURRICULUM_CONFIGS[curriculum as CurriculumType].grades;
}

export function formatCurriculumGrade(curriculum?: string, grade?: string, section?: string): string {
  const parts: string[] = [];
  if (curriculum) parts.push(curriculum);
  if (grade) parts.push(grade);
  if (section) parts.push(`Sec ${section}`);
  return parts.length > 0 ? parts.join(' • ') : 'Standard';
}
