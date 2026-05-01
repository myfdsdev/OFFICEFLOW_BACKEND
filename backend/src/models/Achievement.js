import mongoose from "mongoose";

const achievementSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    badge_type: {
      type: String,
      required: true,
      trim: true,
    },
    badge_name: {
      type: String,
      required: true,
      trim: true,
    },
    earned_date: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

achievementSchema.index({ user_id: 1, badge_type: 1 }, { unique: true });

export default mongoose.model("Achievement", achievementSchema);
