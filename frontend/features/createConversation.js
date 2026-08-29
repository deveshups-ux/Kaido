import api from "../src/utils/axios";

export const createConversation = async () => {
  try {
    const { data } = await api.post("/api/chat/create-conversation");
    return data.conversation;
  } catch (error) {
    console.log(error);
    return null;
  }
};
