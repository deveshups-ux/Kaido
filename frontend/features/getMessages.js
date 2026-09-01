import React from "react";
import api from "../src/utils/axios";

const getMessages = async (id) => {
  try {
    const { data } = await api.get(`/api/chat/get-messages/${id}`);
    console.log(data);
    return data.messages;
  } catch (error) {
    console.log(error);
    return [];
  }
};

export default getMessages;
