import React, { useEffect, useState } from "react";
import {
  PanelLeft,
  PenBoxIcon,
  Plus,
  MessageSquare,
  User,
  Coins,
  LogOut,
  PanelRight,
  X,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setUserData } from "../src/redux/userSlice";
import { getConversations } from "../features/getConversations";
import {
  addConversation,
  setConversations,
  setSelectedConversation,
} from "../src/redux/conversationSlice";
import { createConversation } from "../features/createConversation";
import logOut from "../features/logOut";
import BillingDrawer from "./BillingDrawer";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showBilling, setShowBilling] = useState(false);

  const dispatch = useDispatch();

  const { conversations, selectedConversation } = useSelector(
    (state) => state.conversation,
  );

  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    const getCov = async () => {
      const data = await getConversations();
      dispatch(setConversations(data));
    };

    getCov();
  }, [userData?._id]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleCreateConversation = async () => {
    if (creating) return;

    setCreating(true);

    try {
      const data = await createConversation();

      if (data) {
        dispatch(addConversation(data));
        dispatch(setSelectedConversation(data));
      }
    } finally {
      setCreating(false);
    }
  };

  const handleConversationSelect = (conversation) => {
    dispatch(setSelectedConversation(conversation));
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    await logOut();
    dispatch(setUserData(null));
  };

  const ConversationList = ({ collapsedView = false }) => {
    return (
      <div
        className={`flex-1 overflow-y-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          collapsedView ? "px-2.5 pt-5" : "px-2.5"
        }`}
      >
        {conversations && conversations.length > 0 ? (
          conversations.map((conv) => {
            const isActive = selectedConversation?._id === conv?._id;

            return (
              <div
                key={conv._id}
                onClick={() => handleConversationSelect(conv)}
                className={`flex items-center gap-2.5 cursor-pointer mb-0.5 rounded-[10px] border transition-colors duration-150 px-2 py-2 ${
                  isActive
                    ? "bg-indigo-500/10 border-indigo-500/[0.18]"
                    : "bg-transparent border-transparent hover:bg-white/[0.04]"
                }`}
              >
                <div
                  className={`flex items-center justify-center shrink-0 w-[28px] h-[28px] rounded-lg transition-colors duration-150 ${
                    isActive
                      ? "bg-indigo-500/15 text-indigo-400"
                      : "bg-white/[0.05] text-slate-500"
                  }`}
                >
                  <MessageSquare size={13} />
                </div>

                {!collapsedView && (
                  <span
                    className={`text-[13px] font-medium truncate ${
                      isActive ? "text-slate-100" : "text-slate-300"
                    }`}
                  >
                    {conv?.title || "New Chat"}
                  </span>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-xs text-slate-500 px-3 py-2">
            No conversations yet
          </p>
        )}
      </div>
    );
  };

  const UserSection = ({ collapsedView = false }) => {
    if (collapsedView) {
      return (
        <div className="relative shrink-0">
          {userData?.avatar && !imageError ? (
            <img
              className="w-9 h-9 rounded-[10px] object-cover border-2 border-indigo-500/25"
              src={userData.avatar}
              alt="image"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-9 h-9 rounded-[10px] bg-white/[0.06] flex items-center justify-center">
              <User size={15} className="text-slate-400" />
            </div>
          )}
        </div>
      );
    }

    return (
      <>
        <div className="mx-2.5 h-px bg-white/[0.06]" />

        <div className="px-3.5 py-3.5">
          {userData ? (
            <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 hover:bg-white/[0.05] transition-colors duration-150">
              <div className="relative shrink-0">
                {userData?.avatar && !imageError ? (
                  <img
                    className="w-9 h-9 rounded-[10px] object-cover border-2 border-indigo-500/25"
                    src={userData.avatar}
                    alt="image"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-9 h-9 rounded-[10px] bg-white/[0.06] flex items-center justify-center">
                    <User size={15} className="text-slate-400" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-semibold text-slate-100 truncate">
                  {userData?.name || "user"}
                </p>

                <p className="text-[11px] text-slate-600 mt-px">Free Plan</p>
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => setShowBilling(true)}
                  className="flex items-center justify-center w-7 h-7 rounded-[7px] border-none bg-transparent text-yellow-500 cursor-pointer hover:bg-white/[0.08] hover:text-slate-400 transition-all duration-150"
                >
                  <Coins size={16} />
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center w-7 h-7 rounded-[7px] border-none bg-transparent text-slate-600 cursor-pointer hover:bg-white/[0.08] hover:text-slate-400 transition-all duration-150"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          ) : (
            <button>Login</button>
          )}
        </div>
      </>
    );
  };

  const ExpandedSidebar = ({ mobile = false }) => {
    return (
      <div className="flex flex-col h-full bg-[#0d0f14]">
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/[0.06]">
          <button
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-colors duration-150 bg-transparent border-none cursor-pointer"
            onClick={() => setCollapsed(true)}
          >
            <PanelLeft size={17} />
          </button>

          <span className="text-[16px] font-semibold text-slate-100 tracking-tight flex-1">
            Kaido
          </span>

          <span className="text-[10px] font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full tracking-wide">
            free
          </span>

          <button
            className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-colors duration-150 bg-transparent border-none cursor-pointer disabled:opacity-50"
            onClick={() => dispatch(setSelectedConversation(null))}
            disabled={creating}
          >
            <PenBoxIcon size={14} />
          </button>

          {mobile && (
            <button
              onClick={() => setMobileOpen(false)}
              className="flex lg:hidden items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-colors"
            >
              <X size={17} />
            </button>
          )}
        </div>

        <div className="px-4 pt-4 pb-1">
          <button
            className="w-full flex items-center justify-center gap-2 text-sm font-medium text-white bg-gradient-to-br from-indigo-500 to-violet-700 rounded-xl py-[10px] border-none cursor-pointer hover:opacity-90 transition-opacity duration-150 disabled:opacity-50"
            onClick={() => dispatch(setSelectedConversation(null))}
            disabled={creating}
          >
            <Plus size={15} />
            New Chat
          </button>
        </div>

        <div className="px-5 pt-4 pb-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-slate-600">
          Recents
        </div>

        <ConversationList />

        <UserSection />
      </div>
    );
  };

  if (collapsed) {
    return (
      <>
        <div className="hidden lg:flex flex-col items-center w-[56px] h-screen bg-[#0d0f14] border-r border-white/[0.06] py-4 gap-1 shrink-0">
          <button
            className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-colors duration-150 bg-transparent border-none cursor-pointer mb-1"
            onClick={() => setCollapsed(false)}
          >
            <PanelRight size={17} />
          </button>

          <button
            className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-colors duration-150 bg-transparent border-none cursor-pointer"
            onClick={() => dispatch(setSelectedConversation(null))}
          >
            <Plus size={17} />
          </button>

          <ConversationList collapsedView />

          <UserSection collapsedView />
        </div>

        <BillingDrawer
          open={showBilling}
          onClose={() => setShowBilling(false)}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 flex lg:hidden items-center justify-center w-10 h-10 rounded-xl bg-[#0d0f14] border border-white/[0.08] text-slate-300 shadow-lg"
      >
        <PanelRight size={18} />
      </button>

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-[60] w-[min(86vw,320px)] transform transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <ExpandedSidebar mobile />
      </div>

      <div className="hidden lg:block lg:static w-[270px] h-screen shrink-0 bg-[#0d0f14] border-r border-white/[0.06]">
        <ExpandedSidebar />
      </div>

      <BillingDrawer open={showBilling} onClose={() => setShowBilling(false)} />
    </>
  );
};

export default Sidebar;
