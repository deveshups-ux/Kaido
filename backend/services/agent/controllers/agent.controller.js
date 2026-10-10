import axios from "axios";
import { graph } from "../graph/graph.js";
import { addMessage } from "../config/memory.js";
import Message from "../../chat/model/message.model.js";

const persistMessage = async (data) => {
  try {
    if (data.conversationId) {
      await Message.create(data);
      return;
    }
  } catch (err) {
    console.warn("Direct Message.create warning:", err.message);
  }

  // Fallback to HTTP if CHAT_SERVICE is set
  const chatUrl = process.env.CHAT_SERVICE || `http://localhost:${process.env.PORT || 8000}/api/chat`;
  try {
    await axios.post(`${chatUrl}/save-message`, data);
  } catch (e) {
    console.warn("HTTP message save fallback warning:", e.message);
  }
};

export const agent = async (req, res, next) => {
  try {
    const { prompt, conversationId, agent } = req.body;
    const file = req.file;
    const userId = req.headers["x-user-id"] || req.user?.userId || req.user?._id;

    // 1. Save incoming user message
    if (conversationId && prompt) {
      await persistMessage({
        conversationId,
        role: "user",
        content: prompt,
      });
    }

    // 2. Invoke Multi-Agent LangGraph workflow
    const result = await graph.invoke({
      prompt,
      conversationId,
      agent,
      userId,
      file,
    });

    const aiResponse = result?.aiResponse || "No response generated.";

    // 3. Update memory
    if (conversationId) {
      try {
        await addMessage(conversationId, "user", prompt);
        await addMessage(conversationId, "assistant", aiResponse);
      } catch (memErr) {
        console.warn("Memory update warning:", memErr.message);
      }

      // 4. Save assistant response
      await persistMessage({
        conversationId,
        role: "assistant",
        content: aiResponse,
        images: result?.images || [],
        artifacts: result?.artifacts || [],
      });
    }

    return res.status(200).json({
      answer: aiResponse,
      images: result?.images || [],
      artifacts: result?.artifacts || [],
    });
  } catch (error) {
    console.error("Agent execution error:", error);
    next(error);
  }
};
