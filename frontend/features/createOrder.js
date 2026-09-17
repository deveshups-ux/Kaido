import React from "react";
import api from "../src/utils/axios";

export const createOrder = async (plan) => {
  try {
    const { data } = await api.post("/api/billing/create", { plan });
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error create billing service:", error);
    return [];
  }
};
