const ServiceModel = require("../models/service.model");
const UserModel = require("../models/user.model");

const getAllMentors = async () => {
  return await UserModel.find({ role: "mentor" });
};

const getMentorById = async (id) => {
  return await UserModel.findOne({ _id: id, role: "mentor" });
};

const getMentorByUsername = async (username) => {
  return await UserModel.findOne({ username, role: "mentor" });
};

const getMentorServices = async (id) => {
  // Get all services for this mentor (for debugging)
  const allServices = await ServiceModel.find({ mentor: id });
  console.log(`Total services for mentor ${id}: ${allServices.length}`);
  console.log(`Active services: ${allServices.filter(s => s.active).length}`);
  console.log(`Inactive services: ${allServices.filter(s => !s.active).length}`);
  
  // Return only active services
  return await ServiceModel.find({ mentor: id, active: true });
};

module.exports = {
  getAllMentors,
  getMentorById,
  getMentorByUsername,
  getMentorServices,
};
