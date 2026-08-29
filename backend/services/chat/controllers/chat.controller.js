import Conversation from "../model/conversation.model.js";
import Message from "../model/message.model.js";

export const createConversation = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    console.log(userId);
    const conversation = await Conversation.create({ userId: userId });
    return res
      .status(201)
      .json({ message: "Conversation created successfully", conversation });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: `Internal server error ${error}` });
  }
};

export const getConversation = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    console.log("userId : ", userId);
    const conversation = await Conversation.find({ userId: userId }).sort({
      updatedAt: -1,
    });
    return res
      .status(200)
      .json({ message: "Conversations fetched successfully", conversation });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: `Internal server error ${error}` });
  }
};

export const updateConversation = async (req, res) => {
  try {
    const { id, title } = req.body;
    const conversation = await Conversation.findByIdAndUpdate(id, {
      title,
    });
    return res.status(200).json({
      message: "Conversation title updated successfully",
      conversation,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: `Internal server error ${error}` });
  }
};

export const saveMessage = async (req, res) => {
  try {
    const { conversationId, role, content } = req.body;
    const savedMessage = await Message.create({
      conversationId,
      content,
      role,
    });
    return res
      .status(201)
      .json({ message: "Message saved successfully", data: savedMessage });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: `Internal server error ${error}` });
  }
};

export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
    }).sort({
      createdAt: 1,
    });
    return res
      .status(200)
      .json({ message: "Messages fetched successfully", messages });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: `Internal server error ${error}` });
  }
};
