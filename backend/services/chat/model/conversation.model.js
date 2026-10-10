import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
    },

    title: {
      type: String,
      default: "New conversation",
    },
  },

  { timestamps: true },
);

import { createDbModel } from "../../../shared/db/modelHelper.js";

const Conversation = createDbModel("chat", "Conversation", conversationSchema);

export default Conversation;
