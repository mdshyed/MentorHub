import AxiosInstances from ".";

const signup = (data) => {
  return AxiosInstances.post("/auth/signup", data);
};

const signin = (data) => {
  return AxiosInstances.post("/auth/signin", data);
};

const authAPI = { signup, signin };
export default authAPI;
