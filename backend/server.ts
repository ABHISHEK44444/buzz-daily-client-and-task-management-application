

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { initCronJobs } from './jobs/whatsappCron.js';
import User from './models/User.js';
import Task from './models/Task.js';
import FollowUp from './models/FollowUp.js';
import OrgMember from './models/OrgMember.js';

// Load env vars and perform critical checks
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌ FATAL ERROR: MONGO_URI environment variable is not set.');
  process.exit(1); // Exit with failure code
}

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---

// Production-ready CORS configuration
const allowedOrigins = [
  // Development URLs
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
];

// Add the deployed frontend URL from environment variables if it exists
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
  console.log(`✅ CORS: Allowing origin: ${process.env.FRONTEND_URL}`);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, server-to-server, or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins for ease of use
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error(`❌ CORS Error: Origin '${origin}' not allowed.`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-email'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// --- API ROUTES DEFINITION ---
// We define routes before starting the server.

// Middleware to find/create user based on email header
const getUser = async (req: Request, res: Response, next: NextFunction) => {
  const customReq = req as any;
  const email = customReq.headers['x-user-email'];
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
    customReq.user = user;
    next();
  } catch (err: any) {
    console.error('❌ AUTH ERROR (500):', err.message || err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
};

// User Profile API
app.patch('/api/user', getUser, async (req: Request, res: Response) => {
  const customReq = req as any;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      customReq.user._id,
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
app.get('/api/tasks', getUser, async (req: Request, res: Response) => {
  const customReq = req as any;
  try {
    const tasks = await Task.find({ userId: customReq.user._id }).sort({ dueDate: 1 });
    res.json(tasks);
  } catch (err: any) {
    console.error('❌ TASK FETCH ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', getUser, async (req: Request, res: Response) => {
  const customReq = req as any;
  try {
    const task = await Task.create({ ...req.body, userId: customReq.user._id });
    res.status(201).json(task);
  } catch (err: any) {
    console.error('❌ TASK CREATE ERROR:', err.message);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.patch('/api/tasks/:id', getUser, async (req: Request, res: Response) => {
  const customReq = req as any;
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: customReq.user._id },
    req.body,
    { new: true }
  );
  res.json(task);
});

app.delete('/api/tasks/:id', getUser, async (req: Request, res: Response) => {
  const customReq = req as any;
  await Task.deleteOne({ _id: req.params.id, userId: customReq.user._id });
  res.status(204).send();
});

// Follow-ups API
app.get('/api/followups', getUser, async (req: Request, res: Response) => {
  const customReq = req as any;
  try {
    const followups = await FollowUp.find({ userId: customReq.user._id }).sort({ nextFollowUpDate: 1 });
    res.json(followups);
  } catch (err: any) {
    console.error('❌ FOLLOWUP FETCH ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch follow-ups' });
  }
});

app.post('/api/followups', getUser, async (req: Request, res: Response) => {
  const customReq = req as any;
  const followup = await FollowUp.create({ ...req.body, userId: customReq.user._id });
  res.status(201).json(followup);
});

app.patch('/api/followups/:id', getUser, async (req: Request, res: Response) => {
  const customReq = req as any;
  const followup = await FollowUp.findOneAndUpdate(
    { _id: req.params.id, userId: customReq.user._id },
    req.body,
    { new: true }
  );
  res.json(followup);
});

app.delete('/api/followups/:id', getUser, async (req: Request, res: Response) => {
  const customReq = req as any;
  await FollowUp.deleteOne({ _id: req.params.id, userId: customReq.user._id });
  res.status(204).send();
});

// Organization API
app.get('/api/org', getUser, async (req: Request, res: Response) => {
  const customReq = req as any;
  try {
    const members = await OrgMember.find({ ownerId: customReq.user._id });
    res.json(members);
  } catch (err: any) {
    console.error('❌ ORG FETCH ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
});

app.post('/api/org', getUser, async (req: Request, res: Response) => {
  const customReq = req as any;
  try {
    const member = await OrgMember.create({ ...req.body, ownerId: customReq.user._id });
    res.status(201).json(member);
  } catch (err: any) {
    console.error('❌ ORG CREATE ERROR:', err.message);
    res.status(500).json({ error: 'Failed to add team member' });
  }
});

app.patch('/api/org/:id', getUser, async (req: Request, res: Response) => {
  const customReq = req as any;
  try {
    const member = await OrgMember.findOneAndUpdate(
      { _id: req.params.id, ownerId: customReq.user._id },
      req.body,
      { new: true }
    );
    res.json(member);
  } catch (err: any) {
    console.error('❌ ORG UPDATE ERROR:', err.message);
    res.status(500).json({ error: 'Failed to update team member' });
  }
});

app.delete('/api/org/:id', getUser, async (req: Request, res: Response) => {
  const customReq = req as any;
  try {
    await OrgMember.deleteOne({ _id: req.params.id, ownerId: customReq.user._id });
    res.status(204).send();
  } catch (err: any) {
    console.error('❌ ORG DELETE ERROR:', err.message);
    res.status(500).json({ error: 'Failed to delete team member' });
  }
});

// Base Routes
app.get('/', (req: Request, res: Response) => {
  res.send('BizTrack API is running...');
});

app.get('/ping', (req: Request, res: Response) => {
  res.status(200).send('pong');
});


// Database Connection & Server Start
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    initCronJobs();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });
