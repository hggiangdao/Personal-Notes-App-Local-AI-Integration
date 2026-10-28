import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tag: {
      type: String,
      required: true,
      trim: true,
    },
    noteDate: {
      type: String,
      required: true,
      default: () => new Date().toISOString().split('T')[0], // 'YYYY-MM-DD'
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      default: '',
    },
    color: {
      type: String,
      default: '#fef08a', // Màu vàng nhạt mặc định
    },
    isPinned: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

export const Note = mongoose.model('Note', noteSchema);
