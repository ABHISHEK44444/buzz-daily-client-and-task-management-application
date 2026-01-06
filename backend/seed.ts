

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Task from './models/Task.js';
import FollowUp from './models/FollowUp.js';
import OrgMember from './models/OrgMember.js';

dotenv.config();

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in .env');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB for seeding...');

    // Clear existing data to ensure a clean slate
    await User.deleteMany({});
    await Task.deleteMany({});
    await FollowUp.deleteMany({});
    await OrgMember.deleteMany({});
    console.log('🗑️ Cleared existing database collections.');

    // 1. Create a Master Admin User
    const adminUser = await User.create({
      name: 'John Doe',
      email: 'john.doe@biztrack.com',
      password: 'password123', 
      role: 'President Team',
      team: 'Global Sales',
      phone: '+15551234567',
      agendaReminderTime: '09:00',
      status: 'Active',
      joinedDate: new Date('2023-01-15'),
      lastLogin: new Date()
    });
    console.log('👤 Seeded Admin User: John Doe');

    // 2. Create Initial Tasks
    const tasks = [
      {
        userId: adminUser._id,
        title: 'Review Q3 Financial Reports',
        description: 'Analyze the P&L statement and prepare summary for investors.',
        priority: 'High',
        status: 'In Progress',
        dueDate: new Date()
      },
      {
        userId: adminUser._id,
        title: 'Update Website Landing Page',
        description: 'Refresh the hero image and copy for the new product launch.',
        priority: 'Medium',
        status: 'Pending',
        dueDate: new Date(Date.now() + 86400000 * 2)
      },
      {
        userId: adminUser._id,
        title: 'Order New Business Cards',
        description: 'Need batch of 500 with updated QR code.',
        priority: 'Low',
        status: 'Pending',
        dueDate: new Date(Date.now() + 86400000 * 5)
      }
    ];
    await Task.insertMany(tasks);
    console.log('📋 Seeded initial Tasks.');

    // 3. Create Follow-ups
    const today = new Date();
    today.setHours(9, 0, 0, 0);

    const followUps = [
      {
        userId: adminUser._id,
        clientName: 'Sarah Jenkins',
        company: 'TechFlow Solutions',
        mobile: '+15559876543',
        email: 'sarah.j@techflow.example.com',
        clientType: 'Prospect',
        frequency: 'Weekly',
        priority: 'High',
        status: 'Pending',
        nextFollowUpDate: today,
        notes: 'Discussed the premium enterprise plan. Needs a custom quote ASAP.'
      },
      {
        userId: adminUser._id,
        clientName: 'Michael Chang',
        company: 'Chang & Partners',
        mobile: '+15554443322',
        email: 'm.chang@cp.example.com',
        clientType: 'Associate',
        frequency: 'Monthly',
        priority: 'Medium',
        status: 'In Progress',
        nextFollowUpDate: today,
        notes: 'Met at the networking event. Interested in partnership opportunities.'
      }
    ];
    await FollowUp.insertMany(followUps);
    console.log('📞 Seeded Client Follow-ups.');

    // 4. Create Org Hierarchy
    const rootNode = await OrgMember.create({
      ownerId: adminUser._id,
      parentId: null,
      name: 'John Doe',
      role: 'President Team',
      level: 'PRESIDENT_TEAM'
    });

    console.log('🌳 Seeded Team Hierarchy.');
    console.log('\n✨ Database seeding completed successfully!');
    // Cast process to any to resolve property 'exit' does not exist on type 'Process'
    (process as any).exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    // Cast process to any to resolve property 'exit' does not exist on type 'Process'
    (process as any).exit(1);
  }
};

seedData();
