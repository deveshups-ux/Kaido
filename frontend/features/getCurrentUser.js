import api from "../src/utils/axios";

const getCurrentUser = async () => {
  try {
    const { data } = await api.get("/api/me");
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
};

export default getCurrentUser;
