export interface Course {
  id?: number;
  code: string;
  title: string;
  units: number;
  category: string;
  major: string;
  description: string;
  syllabus: string;
  prereqs: string[];
  offered: string[];
}

export interface PlanResult {
  feasibility: string;
  estimatedGraduationTerm: string;
  remainingUnits: number;
  completedCourses: string[];
  riskFlags: string[];
  semesters: {
    term: string;
    totalUnits: number;
    courses: { code: string; title: string; units: number; warnings: string[] }[];
  }[];
  requirements: { name: string; status: string; url: string }[];
  recommendations: {
    code: string;
    title: string;
    sections: number;
    modality: string;
    instructors: string[];
  }[];
}

export interface ToastMsg {
  title: string;
  desc?: string;
  type: 'success' | 'error' | 'info';
}

export interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}
