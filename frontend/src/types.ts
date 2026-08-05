export type TaskStatus = 'Not started' | 'In progress' | 'Done';
export type TaskPriority = 'Low Priority' | 'Minimal Priority' | 'High Priority' | '';

export interface OnboardingTaskItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role?: string;
  team?: string; // primary team e.g., 'Engineering', 'Marketing', 'Design & UX', 'Operations', 'Product'
  teams?: string[]; // multi-team / department assignment
  accessLevel?: 'Super Admin' | 'Member';
  onboardingStatus?: 'Invited' | 'In Progress' | 'Completed';
  joinedDate?: string;
  skills?: string[];
  onboardingChecklist?: OnboardingTaskItem[];
  avatarUrl?: string;
  avatarChar: string;
  color: string; // Tailwind class background
  isMe?: boolean;
  password?: string; // Generated login credentials for onboarding
}

export interface Task {
  id: string;
  task: string;
  description: string;
  status: TaskStatus;
  dueDate: string;
  priority: TaskPriority;
  timeSpent?: number;
  tags: string[];
  assignedTo: string[]; // TeamMember IDs
  createdAt: string;
  createdBy: string;
  attachments?: { id: string; name: string; url: string }[];
  subtasks?: { id: string; title: string; completed: boolean }[];
}

export interface Comment {
  id: string;
  taskId: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  content: string;
  timestamp: string;
}

export interface ActivityLog {
  id: string;
  taskId?: string;
  userId: string;
  userName: string;
  action: string; // e.g., 'created', 'updated status to In progress'
  timestamp: string;
  details?: string;
}

export interface UserSession {
  email: string;
  name: string;
  securityQuestion: string;
  securityAnswer: string;
}

// Social Media Marketing Section Types
export type SocialPlatform = 'Instagram' | 'LinkedIn' | 'Twitter / X' | 'YouTube' | 'TikTok' | 'Facebook' | 'Pinterest' | 'Threads';

export type ContentPillar = 'Educational' | 'Product' | 'Promotional' | 'Behind The Scenes' | 'User Story' | 'Entertainment' | 'Thought Leadership';

export type ContentFormat = 'Reel / Short' | 'Carousel' | 'Single Image' | 'Video' | 'Article' | 'Story' | 'Thread' | 'Infographic';

export type DesignStatus = 'Briefed' | 'In Progress' | 'Review' | 'Approved' | 'Done';

export type CaptionStatus = 'Draft' | 'Review' | 'Approved' | 'Done';

export type ApprovalStatus = 'Pending' | 'Approved' | 'Needs Changes';

export type PublishingStatus = 'Draft' | 'Scheduled' | 'Published' | 'Delayed' | 'Cancelled';

export interface SocialMediaPost {
  id: string;
  date: string;
  day: string;
  platform: SocialPlatform;
  contentPillar: ContentPillar;
  contentFormat: ContentFormat;
  campaign: string;
  product: string;
  titleHook: string;
  cta: string;
  owner: string;
  influencer: string;
  designStatus: DesignStatus;
  captionStatus: CaptionStatus;
  approval: ApprovalStatus;
  postTime: string;
  publishingStatus: PublishingStatus;
  urlLink: string;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  orders: number;
  revenue: number;
  remarks: string;
}

