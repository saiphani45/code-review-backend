import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  github_id: string;
  username: string;
  email: string;
  access_token: string;
  created_at: Date;
}

const UserSchema = new Schema({
  github_id: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  access_token: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>("User", UserSchema);
