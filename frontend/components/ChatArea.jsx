import React from "react";
import Nav from "./Nav";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import { useEffect } from "react";
import getMessages from "../features/getMessages";
import { useDispatch, useSelector } from "react-redux";
import { setMessages } from "../src/redux/messageSlice";

const ChatArea = () => {
  const { selectedConversation } = useSelector((state) => state.conversation);
  const dispatch = useDispatch();
  useEffect(() => {
    const getMesg = async () => {
      if (selectedConversation) {
        if (selectedConversation.title === "New conversation") return;
        const data = await getMessages(selectedConversation?._id);
        dispatch(setMessages(data));
      }
    };
    getMesg();
  }, [selectedConversation?._id]);

  return (
    <div className="flex-1 flex flex-col">
      <Nav />
      <MessageList />
      <ChatInput />
    </div>
  );
};

export default ChatArea;
