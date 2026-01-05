




// FIX: Aliased Request and Response to avoid conflict with global DOM types.
import express, { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';
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

// Enhanced, production-ready CORS configuration to resolve deployment issues.
const allowedOrigins = [
  // Development URLs
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
];

const frontendUrl = process.env.FRONTEND_URL;
if (frontendUrl) {
  // Sanitize URL by removing any trailing slash to prevent mismatch errors
  const sanitizedUrl = frontendUrl.endsWith('/') ? frontendUrl.slice(0, -1) : frontendUrl;
  allowedOrigins.push(sanitizedUrl);
  console.log(`✅ CORS: Production URL '${sanitizedUrl}' has been added to the list of allowed origins.`);
} else if (process.env.NODE_ENV === 'production') {
  console.warn(`⚠️ CORS WARNING: 'FRONTEND_URL' environment variable is not set. Your deployed frontend will be blocked.`);
}

app.use(cors({
  origin: (origin, callback) => {
    // The '!origin' check allows server-to-server requests and REST tools.
    // The `allowedOrigins.includes(origin)` check validates requests from browsers.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Block requests from unapproved origins
      console.error(`❌ CORS Blocked: The origin '${origin}' is not in the allowed list: [${allowedOrigins.join(', ')}]`);
      callback(new Error('This origin is not allowed by the server\'s CORS policy.'));
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
// FIX: Use aliased Express types for request, response, and next function.
const getUser = async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
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
// FIX: Use aliased Express types for request and response.
app.patch('/api/user', getUser, async (req: ExpressRequest, res: ExpressResponse) => {
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
// FIX: Use aliased Express types for request and response.
app.get('/api/tasks', getUser, async (req: ExpressRequest, res: ExpressResponse) => {
  const customReq = req as any;
  try {
    const tasks = await Task.find({ userId: customReq.user._id }).sort({ dueDate: 1 });
    res.json(tasks);
  } catch (err: any) {
    console.error('❌ TASK FETCH ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// FIX: Use aliased Express types for request and response.
app.post('/api/tasks', getUser, async (req: ExpressRequest, res: ExpressResponse) => {
  const customReq = req as any;
  try {
    const task = await Task.create({ ...req.body, userId: customReq.user._id });
    res.status(201).json(task);
  } catch (err: any) {
    console.error('❌ TASK CREATE ERROR:', err.message);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// FIX: Use aliased Express types for request and response.
app.patch('/api/tasks/:id', getUser, async (req: ExpressRequest, res: ExpressResponse) => {
  const customReq = req as any;
  // FIX: Added try-catch block for robust error handling.
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: customReq.user._id },
      req.body,
      { new: true }
    );
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(task);
  } catch (err: any) {
    console.error(`❌ TASK UPDATE ERROR for ID ${req.params.id}:`, err.message);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// FIX: Use aliased Express types for request and response.
app.delete('/api/tasks/:id', getUser, async (req: ExpressRequest, res: ExpressResponse) => {
  const customReq = req as any;
  // FIX: Added try-catch block for robust error handling.
  try {
    const result = await Task.deleteOne({ _id: req.params.id, userId: customReq.user._id });
    if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Task not found" });
    }
    res.status(204).send();
  } catch (err: any) {
    console.error(`❌ TASK DELETE ERROR for ID ${req.params.id}:`, err.message);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Follow-ups API
// FIX: Use aliased Express types for request and response.
app.get('/api/followups', getUser, async (req: ExpressRequest, res: ExpressResponse) => {
  const customReq = req as any;
  try {
    const followups = await FollowUp.find({ userId: customReq.user._id }).sort({ nextFollowUpDate: 1 });
    res.json(followups);
  } catch (err: any) {
    console.error('❌ FOLLOWUP FETCH ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch follow-ups' });
  }
});

// FIX: Use aliased Express types for request and response.
app.post('/api/followups', getUser, async (req: ExpressRequest, res: ExpressResponse) => {
  const customReq = req as any;
  // FIX: Added try-catch block for robust error handling.
  try {
    const followup = await FollowUp.create({ ...req.body, userId: customReq.user._id });
    res.status(201).json(followup);
  } catch (err: any) {
    console.error('❌ FOLLOWUP CREATE ERROR:', err.message);
    res.status(500).json({ error: 'Failed to create follow-up' });
  }
});

// FIX: Use aliased Express types for request and response.
app.patch('/api/followups/:id', getUser, async (req: ExpressRequest, res: ExpressResponse) => {
  const customReq = req as any;
  // FIX: Added try-catch block for robust error handling.
  try {
    const followup = await FollowUp.findOneAndUpdate(
      { _id: req.params.id, userId: customReq.user._id },
      req.body,
      { new: true }
    );
    if (!followup) {
      return res.status(404).json({ error: "Follow-up not found" });
    }
    res.json(followup);
  } catch (err: any) {
    console.error(`❌ FOLLOWUP UPDATE ERROR for ID ${req.params.id}:`, err.message);
    res.status(500).json({ error: 'Failed to update follow-up' });
  }
});

// FIX: Use aliased Express types for request and response.
app.delete('/api/followups/:id', getUser, async (req: ExpressRequest, res: ExpressResponse) => {
  const customReq = req as any;
  // FIX: Added try-catch block for robust error handling.
  try {
    const result = await FollowUp.deleteOne({ _id: req.params.id, userId: customReq.user._id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Follow-up not found" });
    }
    res.status(204).send();
  } catch (err: any) {
    console.error(`❌ FOLLOWUP DELETE ERROR for ID ${req.params.id}:`, err.message);
    res.status(500).json({ error: 'Failed to delete follow-up' });
  }
});

// Organization API
// FIX: Use aliased Express types for request and response.
app.get('/api/org', getUser, async (req: ExpressRequest, res: ExpressResponse) => {
  const customReq = req as any;
  try {
    const members = await OrgMember.find({ ownerId: customReq.user._id });
    res.json(members);
  } catch (err: any) {
    console.error('❌ ORG FETCH ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
});

// FIX: Use aliased Express types for request and response.
app.post('/api/org', getUser, async (req: ExpressRequest, res: ExpressResponse) => {
  const customReq = req as any;
  try {
    const member = await OrgMember.create({ ...req.body, ownerId: customReq.user._id });
    res.status(201).json(member);
  } catch (err: any) {
    console.error('❌ ORG CREATE ERROR:', err.message);
    res.status(500).json({ error: 'Failed to add team member' });
  }
});

// FIX: Use aliased Express types for request and response.
app.patch('/api/org/:id', getUser, async (req: ExpressRequest, res: ExpressResponse) => {
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

// FIX: Use aliased Express types for request and response.
app.delete('/api/org/:id', getUser, async (req: ExpressRequest, res: ExpressResponse) => {
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
// FIX: Use aliased Express types for request and response.
app.get('/', (req: ExpressRequest, res: ExpressResponse) => {
  res.send('BizTrack API is running...');
});

// FIX: Use aliased Express types for request and response.
app.get('/ping', (req: ExpressRequest, res: ExpressResponse) => {
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
