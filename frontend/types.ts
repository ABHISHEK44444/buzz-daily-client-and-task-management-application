
export enum Priority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
}

export enum Status {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  ARCHIVED = 'Archived',
}

export enum ClientType {
  PROSPECT = 'Prospect',
  USER = 'User',
  ASSOCIATE = 'Associate',
}

export enum Frequency {
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  BIWEEKLY = 'Every 2 Weeks',
  MONTHLY = 'Monthly',
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  dueDate: string;
  notes?: string;
}

export interface FollowUp {
  id: string;
  clientName: string;
  company: string;
  mobile: string;
  clientType: ClientType;
  frequency: Frequency;
  lastContactDate: string;
  nextFollowUpDate: string;
  notes: string;
  status: Status;
  email: string;
  avatarUrl?: string;
  priority: Priority;
}

export type OrgLevel = 
  | 'ROOT'
  | 'SUPERVISOR' 
  | 'WORLD_TEAM' 
  | 'ACTIVE_WORLD_TEAM' 
  | 'GET' 
  | 'GET_2500' 
  | 'MILLIONAIRE_TEAM' 
  | 'MILLIONAIRE_TEAM_7500' 
  | 'PRESIDENT_TEAM' 
  | 'CHAIRMAN_CLUB' 
  | 'FOUNDER_CIRCLE';

export interface OrgNode {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  children?: OrgNode[];
  level: OrgLevel;
}

export interface UserProfile {
  name: string;
  email: string;
  password?: string;
  role: string;
  team: string;
  status: 'Active' | 'Inactive';
  lastLogin: string;
  joinedDate: string;
  passwordLastChanged?: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  agendaReminderTime?: string; // Format "HH:mm"
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  TASKS = 'TASKS',
  FOLLOW_UPS = 'FOLLOW_UPS',
  ORG_CHART = 'ORG_CHART',
  CALENDAR = 'CALENDAR',
  PROFILE = 'PROFILE',
}
