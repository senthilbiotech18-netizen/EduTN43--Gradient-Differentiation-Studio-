export type TierType = 'Support' | 'Core' | 'Extend';

export type DifferentiationAxis = 'readiness' | 'profile' | 'product';

export interface LaneData {
  tier: TierType;
  task_text: string;
  scaffold: string;
  vocab: string[];
  hints?: string[];
}

export interface TalkMove {
  tier: TierType;
  prompts: string[];
}

export interface DiffusedResult {
  id: string;
  originalTask: string;
  context: string;
  axis: DifferentiationAxis;
  lanes: LaneData[];
  talk_moves: TalkMove[];
  grouping_tip: string;
  createdAt: string;
}

export interface StudentAnswer {
  studentName: string;
  studentId?: string;
  tier: TierType;
  answerText: string;
  lastUpdated: string;
  pasteAttemptCount?: number;
}

export interface MarkingFeedback {
  level: 'Beginning' | 'Developing' | 'Secure' | 'Excelling';
  strength: string;
  next_step: string;
  detailed_feedback?: string;
  markedAt: string;
}

export interface StudentWorkPackage {
  id: string;
  taskTitle: string;
  context: string;
  axis: DifferentiationAxis;
  tier: TierType;
  question: string;
  scaffold: string;
  vocab: string[];
  studentName: string;
  studentId?: string;
  answerText: string;
  submittedAt: string;
  feedback?: MarkingFeedback;
}

export interface ClassAssignment {
  id: string;
  code: string;
  title: string;
  teacherName: string;
  originalTask: string;
  context: string;
  axis: DifferentiationAxis;
  lanes: LaneData[];
  talk_moves: TalkMove[];
  grouping_tip: string;
  createdAt: string;
  allowSelfSelection: boolean;
  status: 'active' | 'closed';
}

export interface ClassSubmission {
  id: string;
  assignmentId: string;
  assignmentCode: string;
  studentName: string;
  studentId?: string;
  tier: TierType;
  answerText: string;
  submittedAt: string;
  feedback?: MarkingFeedback;
  pasteAttemptCount?: number;
}

export type AppViewMode = 'diffuse_studio' | 'live_class_board' | 'student_portal';

