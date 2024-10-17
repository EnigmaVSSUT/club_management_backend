import mongoose, { Schema } from "mongoose";
import { higherMemberLimit } from "../constants/constant.js";
import bcrypt from "bcrypt"
const baseUserSchema = new Schema({
  type: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

const baseEventSchema = new Schema({
  type: {
    type: Schema.Types.ObjectId,
    ref: "Event",
  },
});

const baseAchievementSchema = new Schema({
  type: {
    type: Schema.Types.ObjectId,
    ref: "Achievement",
  },
});

const clubSchema = new Schema(
  {
    clubName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    achievements: [baseAchievementSchema],
    facultyAdvisor: {
      type: String,
      required: [true, "Faculty Advisor name is required"],
      trim: true,
    },
    coordinator: {
      type: [String],
      required: true,
      validate: {
        validator: (value) => value.length <= higherMemberLimit,
        message: "Exceed the higher member limit of 2",
      },
    },
    assistantCoordinator: {
      type: [String],
      required: true,
      validate: {
        validator: (value) => value.length <= higherMemberLimit,
        message: "Exceed the higher member limit of 2",
      },
    },
    clubLogo: {
      type: String,
      required:  [true, "Club logo is required"],
    },
    clubDescription: {
      type: String,
      required:  [true, "Club description is required"],
    },
    members: [baseUserSchema],
    type: {
      type: String,
      required: true,
      enum: ["Tech", "Non-Tech"],
      default: "Tech",
    },
    events: [baseEventSchema],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    serviceMail: {
      type: String,
      require: true,
      unique: true,
      trim: true,
      index: true,
    },
  },
  { timestamps: true }
);

clubSchema.pre(/^(find|findOne)/, function () {
  this.populate("coordinator");
  this.populate("assistantCoordinator");
});

clubSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = bcrypt.hash(this.password, salt);
  next();
});

export const Club = mongoose.model("Club", clubSchema);
