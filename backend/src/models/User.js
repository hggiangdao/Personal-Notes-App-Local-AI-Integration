import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
    },
    password: {
      type: String,
      required: true,
      minlength: 4,
    },
    tags: {
      type: [String],
      default: [],
    }
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model('User', userSchema);
