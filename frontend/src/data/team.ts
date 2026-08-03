import { TeamMember, Task } from '../types';

export const AVAILABLE_TEAMS = [
  'Engineering',
  'Marketing',
  'Design & UX',
  'Product',
  'Operations',
  'Sales & QA'
];

export const DEFAULT_ADMIN_MEMBER: TeamMember = {
  id: 'admin_member_default',
  name: 'Workspace Admin',
  email: 'admin@pinobite.com',
  password: 'Password123!',
  role: 'Lead Administrator & Workspace Owner',
  team: 'Engineering',
  accessLevel: 'Admin',
  avatarChar: 'A',
  color: 'indigo',
  onboardingStatus: 'Completed',
  skills: ['System Security', 'React', 'Fullstack', 'Sprint Planning'],
  isMe: true
};

export const INITIAL_TEAM: TeamMember[] = [DEFAULT_ADMIN_MEMBER];

export const INITIAL_TASKS: Task[] = [];

export const TAG_OPTIONS = ['Ops', 'Sprint-1', 'Security', 'Auth', 'Design', 'UI-Kit', 'Frontend', 'Performance', 'Analytics', 'Bugs'];

