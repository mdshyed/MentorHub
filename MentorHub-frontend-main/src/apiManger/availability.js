import AxiosInstances from ".";

const getMentorAvailability = async (mentorId, duration) => {
  return await AxiosInstances.get(
    `availability/${mentorId}?duration=${duration}`
  );
};

const getAvailability = async () => {
  return await AxiosInstances.get("/availability");
};

const createAvailability = async (availabilityData) => {
  return await AxiosInstances.post("/availability", availabilityData);
};

const updateAvailability = async (availabilityData) => {
  return await AxiosInstances.put("/availability", availabilityData);
};

export default { 
  getMentorAvailability,
  getAvailability,
  createAvailability,
  updateAvailability,
};
