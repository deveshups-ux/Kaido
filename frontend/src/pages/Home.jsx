import React from "react";
import { signInWithPopup } from "firebase/auth";
import { FcGoogle } from "react-icons/fc";
import { auth, googleProvider } from "../utils/firebase.js";
import api from "../utils/axios.js";
import { useDispatch, useSelector } from "react-redux";
import { setUserData } from "../redux/userSlice.js";

import ChatArea from "../../components/ChatArea.jsx";
import Artifact from "../../components/Artifact.jsx";
import Sidebar from "../../components/Sidebar.jsx";

const Home = () => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await api.get("/api/me");
        if (data?.user) {
          dispatch(setUserData(data.user));
        }
      } catch (_) {
        // User not logged in yet
      }
    };
    checkAuth();
  }, [dispatch]);

  const handleLogin = async (token) => {
    try {
      const { data } = await api.post("/api/auth/login", { token });
      if (data?.sessionId) {
        localStorage.setItem("kaido_session_id", data.sessionId);
      }
      dispatch(setUserData(data.user || data));
      console.log("Login Success:", data);
    } catch (error) {
      console.log("Backend Login Error:", error);
      setErrorMsg(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Backend server se connect nahi ho paya. Please try again."
      );
    }
  };

  const googleLogin = async () => {
    setErrorMsg("");
    setLoading(true);
    try {
      const data = await signInWithPopup(auth, googleProvider);
      const token = await data.user.getIdToken();
      console.log("Firebase Token:", token);
      await handleLogin(token);
    } catch (error) {
      console.log("Google Login Failed:", error);
      if (error?.code === "auth/unauthorized-domain") {
        setErrorMsg("Firebase Console me ye domain (Authorized Domain) add karna hoga.");
      } else if (error?.code === "auth/popup-closed-by-user") {
        setErrorMsg("Login popup close ho gaya. Please try again.");
      } else {
        setErrorMsg(error?.message || "Google login failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex bg-[#0d0f14] text-white overflow-hidden">
      <Sidebar />
      <ChatArea />
      <Artifact />
      {!userData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur">
          <div className="w-[360px] bg-[#13151c] border border-white/[0.08] rounded-2xl p-7 flex flex-col gap-5 shadow-2xl">
            <div className="flex flex-col gap-1">
              <h2 className="text-[18px] font-semibold text-slate-100 tracking-tight">
                Welcome to Kaido
              </h2>
              <p className="text-[13px] text-slate-400">
                Please login to continue using the AI workspace.
              </p>
            </div>

            {errorMsg && (
              <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/50 rounded-lg p-2.5 break-words">
                {errorMsg}
              </div>
            )}

            <button
              onClick={googleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-[11px] rounded-xl text-sm font-medium text-black/90 bg-white hover:bg-gray-200 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FcGoogle size={18} />
              {loading ? "Signing in..." : "Continue With Google"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
