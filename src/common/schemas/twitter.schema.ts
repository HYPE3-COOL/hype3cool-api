import { Schema } from 'mongoose';

export const TwitterSchema = new Schema(
  {
    id: { type: String, required: true, index: true },
    name: { type: String, required: true }, // displayName
    username: { type: String, required: true },
    image: { type: String, required: false }, // avatar
    description: { type: String, required: false }, // biography 
    biography: { type: String, required: false }, // biography 
    avatar: { type: String, required: false },
    banner: { type: String, required: false },
    verified: { type: Boolean, required: false }, // isVerified (deprecated)
    followersCount: { type: Number, required: false },
    followingCount: { type: Number, required: false },
    friendsCount: { type: Number, required: false },
    mediaCount: { type: Number, required: false },
    isPrivate: { type: Boolean, required: false },
    isVerified: { type: Boolean, required: false },
    likesCount: { type: Number, required: false },
    listedCount: { type: Number, required: false },
    location: { type: String, required: false },
    tweetsCount: { type: Number, required: false },
    url: { type: String, required: false },
    isBlueVerified: { type: Boolean, required: false },
    joined: { type: Date, required: false },
  },
  { _id: false }, // Exclude the _id field
);