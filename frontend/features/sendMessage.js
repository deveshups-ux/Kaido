import React from "react";
import api from "../src/utils/axios";

const sendMessage = async (payload) => {
  try {
    const { data } = await api.post("/api/agent/chat", payload);
    return data;
  } catch (error) {
    console.error("Error sending message:", error);
    return {
      error: true,
      status: error.response?.status,
      message:
        error.response?.data?.message ||
        "Sorry, something went wrong. Please try again.",
    };
  }
};
export default sendMessage;
