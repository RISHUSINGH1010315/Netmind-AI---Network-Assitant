import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';

import { wrapModelWithProxy } from './modelProxy';

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['Super Admin', 'Network Engineer', 'NOC Engineer', 'Security Analyst', 'Viewer'],
      default: 'Viewer'
    }
  },
  { timestamps: true }
);

// Encrypt password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err: any) {
    return next(err);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

const RealUser = model('User', UserSchema);
export const User = wrapModelWithProxy('User', RealUser);
export default User;
