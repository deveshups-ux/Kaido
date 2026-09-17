import React from "react";
import api from "../src/utils/axios";

export const verifyPayment = async (payload) => {
  try {
    const { data } = await api.post("/api/billing/verify", payload);
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error verify payment:", error);
    return [];
  }
};
