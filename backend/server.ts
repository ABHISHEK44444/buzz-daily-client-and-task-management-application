// FIX: Using qualified types (express.Request, express.Response, etc.) to avoid conflicts with global DOM types and resolve type errors.
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

// Create a dedicated router for API endpoints
const apiRouter = express.Router();

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

// Mount the API router under the /api prefix
app.use('/api', apiRouter);


// --- AUTHENTICATION ROUTES (on apiRouter) ---
apiRouter.post('/register', async (req: Request, res: Response) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'Missing required fields: name, email, password, role.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: 'An account with this email already exists.' });
        }
        
        // SECURITY WARNING: In a real production app, you MUST hash the password.
        // Storing plaintext passwords is a major security vulnerability.
        
        const newUser = await User.create({
            name,
            email,
            password: password, // Storing plaintext password due to project constraints
            role,
            status: 'Active',
            team: 'Independent Admin',
        });

        res.status(201).json({
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            team: newUser.team,
            status: newUser.status,
            lastLogin: newUser.lastLogin.toLocaleString(),
            joinedDate: newUser.joinedDate.toISOString().split('T')[0],
            phone: newUser.phone,
            bio: newUser.bio,
            agendaReminderTime: newUser.agendaReminderTime,
        });
    } catch (err: any) {
        console.error('❌ REGISTER ERROR:', err.message);
        res.status(500).json({ error: 'Server error during registration.' });
    }
});

apiRouter.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'Account not found. Please verify your email or create a new account.' });
        }

        // SECURITY WARNING: This is an insecure password comparison.
        const isMatch = user.password === password;

        if (!isMatch) {
            return res.status(401).json({ error: 'The password you entered is incorrect. Please try again.' });
        }
        
        // Update last login
        user.lastLogin = new Date();
        await user.save();

        res.status(200).json({
            name: user.name,
            email: user.email,
            role: user.role,
            team: user.team,
            status: user.status,
            lastLogin: user.lastLogin.toLocaleString(),
            joinedDate: user.joinedDate.toISOString().split('T')[0],
            phone: user.phone,
            bio: user.bio,
            agendaReminderTime: user.agendaReminderTime,
        });

    } catch (err: any) {
        console.error('❌ LOGIN ERROR:', err.message);
        res.status(500).json({ error: 'Server error during login.' });
    }
});

// Secure middleware to find user based on email header, but does NOT create users.
const getUser = async (req: Request, res: Response, next: NextFunction) => {
  const customReq = req as any;
  const email = customReq.headers['x-user-email'];
  if (!email) return res.status(401).json({ error: 'User email header (`x-user-email`) is required for this operation.' });
  
  try {
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized: User not found. Please log in again.' });
    }
    customReq.user = user;
    next();
  } catch (err: any) {
    console.error('❌ AUTH ERROR (500):', err.message || err);
    res.status(500).json({ error: 'Internal Server Error during user validation', details: err.message });
  }
};

// User Profile & Session Verification API
apiRouter.get('/user', getUser, async (req: Request, res: Response) => {
    const customReq = req as any;
    // The user object is attached by the getUser middleware.
    // Exclude password from the returned user object for security.
    const { password, ...userProfile } = customReq.user.toObject();
    res.json(userProfile);
});

apiRouter.patch('/user', getUser, async (req: Request, res: Response) => {
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

// Change user password
apiRouter.patch('/user/password', getUser, async (req: Request, res: Response) => {
  const customReq = req as any;
  const { currentPassword, newPassword } = req.body;
  const user = customReq.user;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new passwords are required.' });
  }

  // SECURITY WARNING: This is an insecure plaintext password comparison.
  // In a real production app, use a secure hashing algorithm like bcrypt.
  if (user.password !== currentPassword) {
    return res.status(401).json({ error: 'The current password you entered is incorrect.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
  }

  try {
    // SECURITY WARNING: Store hashed passwords in production.
    user.password = newPassword;
    await user.save();
    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err: any) {
    console.error('❌ PASSWORD UPDATE ERROR:', err.message);
    res.status(500).json({ error: 'Server error: Failed to update password.' });
  }
});

// Tasks API
apiRouter.get('/tasks', getUser, async (req: Request, res: Response) => {
  const customReq = req as any;
  try {
    const tasks = await Task.find({ userId: customReq.user._id }).sort({ dueDate: 1 });
    res.json(tasks);
  } catch (err: any) {
    console.error('❌ TASK FETCH ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

apiRouter.post('/tasks', getUser, async (req: Request, res: Response) => {
  const customReq = req as any;
  try {
    const task = await Task.create({ ...req.body, userId: customReq.user._id });
    res.status(201).json(task);
  } catch (err: any) {
    console.error('❌ TASK CREATE ERROR:', err.message);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

apiRouter.patch('/tasks/:id', getUser, async (req: Request, res: Response) => {
  const customReq = req as any;
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

apiRouter.delete('/tasks/:id', getUser, async (req: Request, res: Response) => {
  const customReq = req as any;
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
apiRouter.get('/followups', getUser, async (req: Request, res: Response) => {
  const customReq = req as any;
  try {
    const followups = await FollowUp.find({ userId: customReq.user._id }).sort({ nextFollowUpDate: 1 });
    res.json(followups);
  } catch (err: any) {
    console.error('❌ FOLLOWUP FETCH ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch follow-ups' });
  }
});

apiRouter.post('/followups', getUser, async (req: Request, res: Response) => {
  const customReq = req as any;
  try {
    const followup = await FollowUp.create({ ...req.body, userId: customReq.user._id });
    res.status(201).json(followup);
  } catch (err: any) {
    console.error('❌ FOLLOWUP CREATE ERROR:', err.message);
    res.status(500).json({ error: 'Failed to create follow-up' });
  }
});

apiRouter.patch('/followups/:id', getUser, async (req: Request, res: Response) => {
  const customReq = req as any;
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

apiRouter.delete('/followups/:id', getUser, async (req: Request, res: Response) => {
  const customReq = req as any;
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
apiRouter.get('/org', getUser, async (req: Request, res: Response) => {
  const customReq = req as any;
  try {
    const members = await OrgMember.find({ ownerId: customReq.user._id });
    res.json(members);
  } catch (err: any) {
    console.error('❌ ORG FETCH ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
});

apiRouter.post('/org', getUser, async (req: Request, res: Response) => {
  const customReq = req as any;
  try {
    const member = await OrgMember.create({ ...req.body, ownerId: customReq.user._id });
    res.status(201).json(member);
  } catch (err: any) {
    console.error('❌ ORG CREATE ERROR:', err.message);
    res.status(500).json({ error: 'Failed to add team member' });
  }
});

apiRouter.patch('/org/:id', getUser, async (req: Request, res: Response) => {
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

apiRouter.delete('/org/:id', getUser, async (req: Request, res: Response) => {
  const customReq = req as any;
  try {
    await OrgMember.deleteOne({ _id: req.params.id, ownerId: customReq.user._id });
    res.status(204).send();
  } catch (err: any) {
    console.error('❌ ORG DELETE ERROR:', err.message);
    res.status(500).json({ error: 'Failed to delete team member' });
  }
});

// Base Routes (on the main app)
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
