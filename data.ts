
import type { Client, Phase, Task, WeekTask, Milestone, WeeklyTarget, Automation } from './types';

export const CLIENTS: Client[] = [
  { id: 'c1', name: 'Innovate Inc.', color: '#3498db' },
  { id: 'c2', name: 'Quantum Leap', color: '#e74c3c' },
  { id: 'c3', name: 'Starlight Solutions', color: '#f1c40f' },
  { id: 'c4', name: 'Apex Digital', color: '#2ecc71' }
];

export const PHASES: Phase[] = [
  { id: 'p1', name: 'Learning & Discovery', color: '#9b59b6' },
  { id: 'p2', name: 'Improving & Optimization', color: '#7f8c8d' },
  { id: 'p3', name: 'Building & Content', color: '#1abc9c' },
  { id: 'p4', name: 'Promoting & Authority', color: '#e67e22' },
  { id: 'p5', name: 'Evaluation & Transition', color: '#bdc3c7' }
];

export const TODAY_TASKS: Task[] = [
  { id: 't1', title: 'Finalize Q4 keyword research for Innovate Inc.', clientId: 'c1', phaseId: 'p1', completed: false },
  { id: 't2', title: "Implement schema markup for Quantum Leap's service pages", clientId: 'c2', phaseId: 'p2', completed: true },
  { id: 't3', title: "Draft blog post on 'AI in Marketing' for Starlight Solutions", clientId: 'c3', phaseId: 'p3', completed: false }
];

export const WEEK_TASKS: WeekTask[] = [
  { id: 'w1', day: 'Monday', title: 'Review backlink profile for Apex Digital', clientId: 'c4', phaseId: 'p4' },
  { id: 'w2', day: 'Tuesday', title: 'Prepare monthly performance report for Innovate Inc.', clientId: 'c1', phaseId: 'p5' },
  { id: 'w3', day: 'Wednesday', title: 'On-page SEO audit for new Quantum Leap landing page', clientId: 'c2', phaseId: 'p2' },
  { id: 'w4', day: 'Thursday', title: 'Outline content calendar for November for Starlight Solutions', clientId: 'c3', phaseId: 'p1' },
  { id: 'w5', day: 'Friday', title: 'Fix 404 errors reported in GSC for Apex Digital', clientId: 'c4', phaseId: 'p2' }
];

export const MONTH_MILESTONES: Milestone[] = [
  { id: 'm1', title: 'Launch new blog for Starlight Solutions', clientId: 'c3', date: 'October 5' },
  { id: 'm2', title: 'Complete technical SEO overhaul for Quantum Leap', clientId: 'c2', date: 'October 18' },
  { id: 'm3', title: 'Innovate Inc. Q3 performance review meeting', clientId: 'c1', date: 'October 26' }
];

export const WEEKLY_TARGET: WeeklyTarget = {
  id: 'wt1',
  title: 'Standardize Client Reporting System',
  description: 'Create one unified reporting template in Looker Studio to be used for all monthly client performance reviews.',
  progress: 65
};

export const AUTOMATIONS: Automation[] = [
  { id: 'a1', name: 'Weekly Update Generator', description: 'GA4 + GSC → Summary → Email', status: 'active' },
  { id: 'a2', name: 'Monthly SEO Report Builder', description: 'KPIs → PDF → Client Delivery', status: 'active' },
  { id: 'a3', name: 'Technical Monitoring', description: 'Crawls for errors → Creates tasks', status: 'active' },
  { id: 'a4', name: 'Content Opportunity Finder', description: 'Query data → New topics → Briefs', status: 'idle' },
  { id: 'a5', name: 'Backlink & Mention Monitor', description: 'Tracks links → Creates tasks', status: 'active' },
  { id: 'a6', name: 'Client Health Score', description: 'Comms + KPIs → Health Rating', status: 'active' },
  { id: 'a7', name: 'Onboarding Automation', description: 'Setup Folder + ClickUp + Templates', status: 'active' }
];
