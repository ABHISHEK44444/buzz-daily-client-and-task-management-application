
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  team: string;
  phone: string;
  agendaReminderTime: string; // "HH:mm"
  avatarUrl?: string;
  bio?: string;
  status: 'Active' | 'Inactive';
  lastLogin: Date;
  joinedDate: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'Supervisor' },
  team: { type: String },
  phone: { type: String },
  agendaReminderTime: { type: String, default: '09:00' },
  avatarUrl: { type: String },
  bio: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  lastLogin: { type: Date, default: Date.now },
  joinedDate: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>('User', UserSchema);
