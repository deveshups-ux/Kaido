import api from "../src/utils/axios.js";

const logOut = async () => {
  try {
    const { data } = await api.post("/api/auth/logout");
    console.log(data);
  } catch (error) {
    console.log(error);
  }
};

export default logOut;
