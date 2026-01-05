
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { initCronJobs } from './jobs/whatsappCron.ts';
import User from './models/User.ts';
import Task from './models/Task.ts';
import FollowUp from './models/FollowUp.ts';
import OrgMember from './models/OrgMember.ts';

// Load env vars
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors() as any);
app.use(express.json({ limit: '10mb' }) as any);

// Database Connection
mongoose.connect(process.env.MONGO_URI || '')
  .then(() => {
    console.log('✅ MongoDB Connected');
    initCronJobs();
  })
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- API ROUTES ---

// Middleware to find/create user based on email header
const getUser = async (req: any, res: any, next: any) => {
  const email = req.headers['x-user-email'];
  if (!email) return res.status(401).json({ error: 'User email required' });
  
  try {
    let user = await User.findOne({ email });
    if (!user) {
      console.log(`Creating new admin user for: ${email}`);
      // Create user on the fly for demo simplicity
      user = await User.create({ 
        name: email.split('@')[0], 
        email, 
        passwordHash: 'default',
        role: 'Supervisor',
        status: 'Active'
      });
    }
    req.user = user;
    next();
  } catch (err: any) {
    console.error('❌ AUTH ERROR (500):', err.message || err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
};

// User Profile API
app.patch('/api/user', getUser, async (req: any, res: any) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: req.body },
      { new: true }
    );
    res.json(updatedUser);
  } catch (err: any) {
    console.error('❌ USER UPDATE ERROR:', err.message);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Tasks API
app.get('/api/tasks', getUser, async (req: any, res: any) => {
  try {
    const tasks = await Task.find({ userId: req.user._id }).sort({ dueDate: 1 });
    res.json(tasks);
  } catch (err: any) {
    console.error('❌ TASK FETCH ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', getUser, async (req: any, res: any) => {
  try {
    const task = await Task.create({ ...req.body, userId: req.user._id });
    res.status(201).json(task);
  } catch (err: any) {
    console.error('❌ TASK CREATE ERROR:', err.message);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.patch('/api/tasks/:id', getUser, async (req: any, res: any) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body,
    { new: true }
  );
  res.json(task);
});

app.delete('/api/tasks/:id', getUser, async (req: any, res: any) => {
  await Task.deleteOne({ _id: req.params.id, userId: req.user._id });
  res.status(204).send();
});

// Follow-ups API
app.get('/api/followups', getUser, async (req: any, res: any) => {
  try {
    const followups = await FollowUp.find({ userId: req.user._id }).sort({ nextFollowUpDate: 1 });
    res.json(followups);
  } catch (err: any) {
    console.error('❌ FOLLOWUP FETCH ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch follow-ups' });
  }
});

app.post('/api/followups', getUser, async (req: any, res: any) => {
  const followup = await FollowUp.create({ ...req.body, userId: req.user._id });
  res.status(201).json(followup);
});

app.patch('/api/followups/:id', getUser, async (req: any, res: any) => {
  const followup = await FollowUp.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body,
    { new: true }
  );
  res.json(followup);
});

app.delete('/api/followups/:id', getUser, async (req: any, res: any) => {
  await FollowUp.deleteOne({ _id: req.params.id, userId: req.user._id });
  res.status(204).send();
});

// Organization API
app.get('/api/org', getUser, async (req: any, res: any) => {
  try {
    const members = await OrgMember.find({ ownerId: req.user._id });
    res.json(members);
  } catch (err: any) {
    console.error('❌ ORG FETCH ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
});

app.post('/api/org', getUser, async (req: any, res: any) => {
  try {
    const member = await OrgMember.create({ ...req.body, ownerId: req.user._id });
    res.status(201).json(member);
  } catch (err: any) {
    console.error('❌ ORG CREATE ERROR:', err.message);
    res.status(500).json({ error: 'Failed to add team member' });
  }
});

app.patch('/api/org/:id', getUser, async (req: any, res: any) => {
  try {
    const member = await OrgMember.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user._id },
      req.body,
      { new: true }
    );
    res.json(member);
  } catch (err: any) {
    console.error('❌ ORG UPDATE ERROR:', err.message);
    res.status(500).json({ error: 'Failed to update team member' });
  }
});

app.delete('/api/org/:id', getUser, async (req: any, res: any) => {
  try {
    // Basic deletion - in production, might want to handle recursive deletion or parent reassignment
    await OrgMember.deleteOne({ _id: req.params.id, ownerId: req.user._id });
    res.status(204).send();
  } catch (err: any) {
    console.error('❌ ORG DELETE ERROR:', err.message);
    res.status(500).json({ error: 'Failed to delete team member' });
  }
});

// Base Routes
app.get('/', (req, res) => {
  res.send('BizTrack API is running...');
});

app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
