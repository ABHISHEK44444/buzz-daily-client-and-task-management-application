

import { Status, Task, FollowUp, ClientType, Frequency, OrgNode, UserProfile } from './types';

export const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Review Q3 Financial Reports',
    description: 'Analyze the P&L statement and prepare summary for investors.',
    status: Status.IN_PROGRESS,
    dueDate: '2023-10-25',
  },
  {
    id: '2',
    title: 'Update Website Landing Page',
    description: 'Refresh the hero image and copy for the new product launch.',
    status: Status.PENDING,
    dueDate: '2023-10-28',
  },
  {
    id: '3',
    title: 'Office Supplies Restock',
    description: 'Order paper, ink, and coffee.',
    status: Status.PENDING,
    dueDate: '2023-11-01',
  },
];

export const INITIAL_FOLLOW_UPS: FollowUp[] = [
  {
    id: '101',
    clientName: 'Sarah Jenkins',
    mobile: '+1 (555) 123-4567',
    clientType: ClientType.PROSPECT,
    frequency: Frequency.WEEKLY,
    email: 'sarah.j@techflow.example.com',
    lastContactDate: '2023-10-15',
    nextFollowUpDate: new Date().toISOString().split('T')[0], // Due Today for demo
    notes: 'Discussed the premium enterprise plan. Needs a custom quote.',
    status: Status.PENDING,
    avatarUrl: 'https://picsum.photos/100/100?random=1',
  },
  {
    id: '102',
    clientName: 'Michael Chang',
    mobile: '+1 (555) 987-6543',
    clientType: ClientType.ASSOCIATE,
    frequency: Frequency.MONTHLY,
    email: 'm.chang@cp.example.com',
    lastContactDate: '2023-10-10',
    nextFollowUpDate: '2023-10-24',
    notes: 'Met at the networking event. Interested in partnership opportunities.',
    status: Status.IN_PROGRESS,
    avatarUrl: 'https://picsum.photos/100/100?random=2',
  },
  {
    id: '103',
    clientName: 'Elara Vane',
    mobile: '+1 (555) 456-7890',
    clientType: ClientType.USER,
    frequency: Frequency.BIWEEKLY,
    email: 'elara@solaris.example.com',
    lastContactDate: '2023-10-01',
    nextFollowUpDate: '2023-10-30',
    notes: 'Signed contract. Check in on onboarding progress.',
    status: Status.PENDING,
    avatarUrl: 'https://picsum.photos/100/100?random=3',
  },
];

export const INITIAL_ORG_DATA: OrgNode = {
  id: 'root',
  name: 'John Doe',
  role: 'President Team',
  level: 'PRESIDENT_TEAM',
  children: []
};

export const INITIAL_USER_PROFILE: UserProfile = {
  name: 'John Doe',
  email: 'john.doe@biztrack.com',
  password: 'password123',
  role: 'President Team',
  team: 'Global Sales',
  status: 'Active',
  lastLogin: new Date().toLocaleString(),
  joinedDate: '2023-01-15',
  passwordLastChanged: '3 months ago',
  avatarUrl: undefined, 
  phone: '+1 (555) 000-0000',
  bio: 'Senior Sales Director passionate about growth and team development.',
  agendaReminderTime: '09:00'
};
