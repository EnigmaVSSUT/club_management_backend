import mongoose, { Schema } from "mongoose";
import {
  clubPhotoLimit,
  domainList,
  hashSaltRound,
  skillsArrayLimit,
} from "../constants/constant.js";
import bcrypt from "bcrypt";

const baseClubUserSchema = new Schema({
  type: {
    type: Schema.Types.ObjectId,
    ref: "Club",
    required: [true, "you must be a club member to register"],
  },
});

const userSchema = new Schema(
  {
    regdNo: {
      type: Number,
      require: true,
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      require: true,
      unique: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      require: [true, "Password is required"],
    },
    fullName: {
      type: String,
      required: true,
      trim: [true, "full name is required"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: [true, "Gender box can't be empty"],
    },
    role: { // default member then admin changed this to others
      type: String,
      enum: ["Member", "Assistant-Coordinator", "Coordinator"],
      default: "Member",
    },
    yearOfGraduation: {
      type: Number,
      required: [true, "choose an year of graduation "],
    },
    clubId: [baseClubUserSchema],
    domain: {
      type: [String],
      enum: domainList,
      validate: {
        validator: function (value) {
          return value.length > 0;
        },
        message: "Domain field must have at least one value.",
      },
    },
    photo: {
      url: String,
    },
    skills: {
      type: [String],
      validate: {
        validator: (value) => value.length <= skillsArrayLimit,
        message: `exceeds the limit of ${skillsArrayLimit}`,
      },
    },
    isAuthenticated: {
      type: Boolean,
      default: false,
    },
    isInClub: {
      type: Boolean,
      default: false,
    },
    githubLink: {
      type: String,
      trim: true,
    },
    linkedinLink: {
      type: String,
      trim: true,
    },
  },

  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(hashSaltRound);
  this.password =await bcrypt.hash(this.password, salt);
  next();
});

export const User = mongoose.model("User", userSchema);
