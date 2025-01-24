import mongoose, { Schema } from "mongoose";

const achievementSchema = new Schema({
  header: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  date:{
    type: String,
    required: true,
  },
  clubId: {
    type: Schema.Types.ObjectId,
    ref: "Club",
    required: true,
  },
  Image: {
    type: String,
    required: true, 
  },
}, { timestamps: true });

const Achievement = mongoose.model("Achievement", achievementSchema);
export default Achievement;
