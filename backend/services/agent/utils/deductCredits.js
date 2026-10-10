import axios from "axios";

export const deductCredits = async (userId, agent) => {
  try {
    const authUrl = process.env.AUTH_SERVICE || `http://localhost:${process.env.PORT || 8000}/api/auth`;
    const { data } = await axios.post(
      `${authUrl}/deduct-credits`,
      { userId, agent },
    );

    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
};
