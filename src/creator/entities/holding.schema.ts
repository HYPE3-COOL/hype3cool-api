import { Schema } from 'mongoose';

export const HoldingSchema = new Schema(
  {
    tokenAddress: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    name: { type: String },
    symbol: { type: String },
  },
  { _id: false },
);
