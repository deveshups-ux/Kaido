import axios from "axios";
import User from "../../auth/models/user.model.js";
import redis from "../../../shared/Redis/redis.js";

const COST = {
  chat: 1,
  search: 5,
  coding: 10,
  pdf: 10,
  ppt: 10,
  vision: 10,
};

export const deductCredits = async (userId, agent) => {
  if (!userId) return null;

  try {
    const requiredCredits = COST[agent] || 1;
    const user = await User.findById(userId);
    if (user && user.credits >= requiredCredits) {
      user.credits -= requiredCredits;
      await user.save();
      const sessionId = await redis.get(`user-session-${user?._id}`);
      if (sessionId) {
        await redis.set(
          `session-${sessionId}`,
          JSON.stringify({
            userId: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            plan: user.plan,
            credits: user.credits,
            totalCredits: user.totalCredits,
            planExpiresAt: user.planExpiresAt,
          }),
          "EX",
          7 * 24 * 60 * 60,
        );
      }
      return { success: true, credits: user.credits };
    }
  } catch (err) {
    console.warn("Direct credit deduction warning:", err.message);
  }

  try {
    const authUrl =
      process.env.AUTH_SERVICE ||
      `http://localhost:${process.env.PORT || 8000}/api/auth`;
    const { data } = await axios.post(
      `${authUrl}/deduct-credits`,
      { userId, agent },
    );
    return data;
  } catch (error) {
    console.warn("HTTP credit deduction warning:", error.message);
    return null;
  }
};
