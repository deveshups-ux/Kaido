import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../utils/firebase.js";
import React from "react";
import api from "../utils/axios.js";

const App = () => {
  const handleLogin = async (token) => {
    try {
      const { data } = await api.post("/auth/login", { token });
      console.log(data);
    } catch (error) {
      console.log(error);
    }
  };

  const googleLogin = async () => {
    const data = await signInWithPopup(auth, googleProvider);
    const token = await data.user.getIdToken();
    console.log(token);
    await handleLogin(token);
    console.log(data);
  };
  return (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <button
        onClick={googleLogin}
        className="bg-white text-black py-2 px-4 rounded-md hover:bg-gray-200"
      >
        continue with google
      </button>
    </div>
  );
};

export default App;
