
export interface Client {
  id: string;
  name: string;
  color: string;
}

export interface Phase {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  clientId: string;
  phaseId: string;
  completed: boolean;
}

export interface WeekTask {
  id: string;
  day: string;
  title: string;
  clientId: string;
  phaseId: string;
}

export interface Milestone {
  id: string;
  title: string;
  clientId: string;
  date: string;
}

export interface WeeklyTarget {
  id: string;
  title: string;
  description: string;
  progress: number;
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'idle';
}
