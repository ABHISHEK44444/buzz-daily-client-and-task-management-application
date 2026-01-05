
import mongoose, { Schema, Document } from 'mongoose';

export interface IOrgMember extends Document {
  ownerId: mongoose.Types.ObjectId; // The admin who "owns" this team node
  parentId: mongoose.Types.ObjectId | null;
  name: string;
  role: string;
  level: string;
  avatarUrl?: string;
}

const OrgMemberSchema: Schema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'OrgMember', default: null },
  name: { type: String, required: true },
  role: { type: String, required: true },
  level: { type: String, required: true },
  avatarUrl: { type: String },
});

export default mongoose.model<IOrgMember>('OrgMember', OrgMemberSchema);
