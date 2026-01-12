
import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Archived';
  dueDate: Date;
  notes?: string;
}

const TaskSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed', 'Archived'], default: 'Pending' },
  dueDate: { type: Date, required: true },
  notes: { type: String },
}, { timestamps: true });

export default mongoose.model<ITask>('Task', TaskSchema);
