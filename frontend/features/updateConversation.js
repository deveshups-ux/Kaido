import api from "../src/utils/axios";

export const updateConversation = async (payload) => {
  try {
    const { data } = await api.post("/api/chat/update-conversation", payload);
    return data.conversation;
  } catch (error) {
    console.error("Error updating conversation:", error);
    return null;
  }
};
