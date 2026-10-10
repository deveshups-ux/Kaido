import axios from "axios";
import Message from "../../chat/model/message.model.js";

export const getMessages = async (conversationId) => {
  try {
    const messages = await Message.find({ conversationId });
    if (messages && messages.length > 0) {
      return messages;
    }
  } catch (err) {
    console.warn("Direct Message.find warning in getMessages:", err.message);
  }

  try {
    const chatUrl =
      process.env.CHAT_SERVICE ||
      `http://localhost:${process.env.PORT || 8000}/api/chat`;
    const { data } = await axios.get(
      `${chatUrl}/get-messages/${conversationId}`,
    );
    return data.messages || [];
  } catch (error) {
    console.error("Error fetching messages via HTTP:", error.message);
    return [];
  }
};
