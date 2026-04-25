import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: function () {
        return this.auth_provider !== "google";
      },
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    auth_provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    google_id: {
      type: String,
      unique: true,
      sparse: true,
    },
    full_name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    department: {
      type: String,
      default: "",
    },
    employee_id: {
      type: String,
      default: "",
    },
    mobile_number: {
      type: String,
      default: "",
    },
    profile_photo: {
      type: String,
      default: "",
    },
    is_online: {
      type: Boolean,
      default: false,
    },
    last_active: {
      type: Date,
      default: Date.now,
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
    is_profile_complete: {
      type: Boolean,
      default: false,
    },
    // Settings fields (company-wide, editable by admin)
    office_start_time: { type: String, default: "09:00" },
    office_end_time: { type: String, default: "18:00" },
    late_threshold_minutes: { type: Number, default: 15 },
    half_day_hours: { type: Number, default: 4 },
    working_days: {
      type: [String],
      default: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    },
  },
  { timestamps: true },
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords during login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);
