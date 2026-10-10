import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    name: String,
    content: String,
  },
  {
    _id: false,
  },
);

const artifactSchema = new mongoose.Schema(
  {
    id: Number,
    type: String,
    files: [fileSchema],
    title: String,
  },

  {
    _id: false,
  },
);

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      default: null,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
    },

    content: String,
    images: [String],
    artifacts: [artifactSchema],
  },
  { timestamps: true },
);

import { createDbModel } from "../../../shared/db/modelHelper.js";

const Message = createDbModel("chat", "Message", messageSchema);

export default Message;
