import { getAuth } from "firebase-admin/auth";
import { app } from "../config/firebase.js";
import User from "../models/user.model.js";
import crypto from "crypto";

export const login = async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = await getAuth(app).verifyIdToken(token);
    let user = await User.findOne({ firebase: decoded.uid });
    if (!user) {
      user = await User.create({
        firebaseUid: decoded.uid,
        email: decoded.email,
        name: decoded.name,
        avatar: decoded.picture,
      });
      const sessionId = crypto.randomUUID();
      res.cookie("session", sessionId, {
        httpOnly: true,
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
