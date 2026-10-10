import axios from "axios";

export const getMessages = async (conversationId) => {
  try {
    const chatUrl = process.env.CHAT_SERVICE || `http://localhost:${process.env.PORT || 8000}/api/chat`;
    const { data } = await axios.get(
      `${chatUrl}/get-messages/${conversationId}`,
    );

    return data.messages || [];
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
};
