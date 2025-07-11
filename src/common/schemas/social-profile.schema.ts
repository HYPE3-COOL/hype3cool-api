import { Schema } from 'mongoose';

export const SocialProfileSchema = new Schema(
  {
    url: { type: String, required: true },
    username: { type: String, required: true },
  },
  { _id: false },
);
