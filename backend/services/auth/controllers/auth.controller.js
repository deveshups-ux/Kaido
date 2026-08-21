import { getAuth } from "firebase-admin/auth";
import { app } from "../config/firebase.js";
import User from "../models/user.model.js";
import crypto from "crypto";
import redis from "../../../shared/Redis/redis.js";

export const login = async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = await getAuth(app).verifyIdToken(token);
    let user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) {
      user = await User.create({
        firebaseUid: decoded.uid,
        email: decoded.email,
        name: decoded.name,
        avatar: decoded.picture,
      });
      const sessionId = crypto.randomUUID();
      await redis.set(
        `session-${sessionId}`,
        JSON.stringify({
          userId: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        }),
        "EX",
        60 * 60 * 24 * 7,
      );
      res.cookie("session", sessionId, {
        httpOnly: false,
        secure: false,
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 7,
      });

      return res.status(201).json({ message: "User created", user: user });
    }
    return res.status(200).json({ message: "User logged in", user });
  } catch (error) {
    console.error("Login error:", error); // ye line add karo
    res.status(401).json({ error: "Invalid token" });
  }
};

export const logout = async (req, res) => {
  try {
    const sessionId = req.cookies.session;
    await redis.del(`session-${sessionId}`);
    res.clearCookie("session");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Failed to logout" });
  }
};
