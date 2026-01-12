

import mongoose, { Schema, Document } from 'mongoose';

export interface IFollowUp extends Document {
  userId: mongoose.Types.ObjectId;
  clientName: string;
  mobile: string;
  email: string;
  clientType: 'Prospect' | 'User' | 'Associate';
  frequency: 'Daily' | 'Weekly' | 'Every 2 Weeks' | 'Monthly';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Archived';
  lastContactDate: Date;
  nextFollowUpDate: Date;
  notes: string;
  avatarUrl?: string;
}

const FollowUpSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  clientName: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String },
  clientType: { type: String, enum: ['Prospect', 'User', 'Associate'], default: 'Prospect' },
  frequency: { type: String, enum: ['Daily', 'Weekly', 'Every 2 Weeks', 'Monthly'], default: 'Weekly' },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed', 'Archived'], default: 'Pending' },
  lastContactDate: { type: Date },
  nextFollowUpDate: { type: Date, required: true },
  notes: { type: String },
  avatarUrl: { type: String },
}, { timestamps: true });

export default mongoose.model<IFollowUp>('FollowUp', FollowUpSchema);
