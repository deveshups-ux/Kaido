import { getAuth } from "firebase-admin/auth";
import { app } from "../config/firebase.js";
import User from "../models/user.model.js";
import crypto from "crypto";
import redis from "../../../shared/Redis/redis.js";

export const login = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    let decoded;
    try {
      decoded = await getAuth(app).verifyIdToken(token);
    } catch (tokenErr) {
      console.error("Token verification failed:", tokenErr);
      return res.status(401).json({ error: "Token verification failed: " + tokenErr.message });
    }

    let user;
    let statusCode = 200;
    let message = "User logged in";

    try {
      user = await User.findOne({ firebaseUid: decoded.uid });
      if (!user) {
        const username = decoded.email
          ? `${decoded.email.split("@")[0]}_${decoded.uid.slice(-6)}`
          : `user_${decoded.uid.slice(-8)}`;

        user = await User.create({
          firebaseUid: decoded.uid,
          email: decoded.email,
          username,
          name: decoded.name || decoded.email?.split("@")[0] || "User",
          avatar: decoded.picture || "",
        });
        statusCode = 201;
        message = "User created";
      }
    } catch (dbErr) {
      console.error("Database error during user login:", dbErr);
      return res.status(500).json({ error: "Database error: " + dbErr.message });
    }

    const sessionId = crypto.randomUUID();
    try {
      await redis.set(
        `user-session-${user?._id}`,
        sessionId,
        "EX",
        7 * 24 * 60 * 60,
      );
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
        60 * 60 * 24 * 7,
      );
    } catch (redisErr) {
      console.error("Redis session error:", redisErr);
    }

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("session", sessionId, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return res.status(statusCode).json({ message, user, sessionId });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message || "Login failed" });
  }
};

export const logout = async (req, res) => {
  try {
    const sessionId = req.cookies.session;
    await redis.del(`session-${sessionId}`);
    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("session", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Failed to logout" });
  }
};

export const updateUserPayment = async (req, res) => {
  try {
    const { plan, credits, userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.plan = plan;
    user.credits += credits;
    user.totalCredits += credits;
    user.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
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
    return res.status(200).json({ message: "update user payment succesfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `update user payment error ${error}` });
  }
};

export const deductCredits = async (req, res) => {
  try {
    const { userId, agent } = req.body;
    const COST = {
      chat: 1,
      search: 5,
      coding: 10,
      pdf: 10,
      ppt: 10,
      vision: 10,
    };
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: "user not found" });
    }
    const requiredCredits = COST[agent] || 1;
    if (user.credits < requiredCredits) {
      return res.status(400).json({ message: "Not enough credits." });
    }
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
    return res.status(200).json({ success: true, credits: user.credits });
  } catch (error) {
    return res.status(500).json({ message: `deduct credits error ${error}` });
  }
};
