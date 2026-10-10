import redis from "../../../shared/Redis/redis.js";
import { getMessages } from "../utils/getMessages.js";

export const getMemory = async (conversationId) => {
  if (!conversationId) return [];
  const key = `messages:${conversationId}`;
  const cached = await redis.get(key);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (_) {}
  }
  const messages = await getMessages(conversationId);
  if (!messages) {
    return [];
  }
  await redis.set(key, JSON.stringify(messages), "EX", 60 * 60 * 24); // Cache for 24 hours
  return messages;
};

export const addMessage = async (conversationId, role, content) => {
  if (!conversationId) return;
  const key = `messages:${conversationId}`;
  const rawMessages = await redis.get(key);
  const messages = rawMessages ? JSON.parse(rawMessages) : [];
  messages.push({ role, content });
  if (messages.length > 20) {
    messages.shift();
  }
  await redis.set(key, JSON.stringify(messages), "EX", 60 * 60 * 24);
};
