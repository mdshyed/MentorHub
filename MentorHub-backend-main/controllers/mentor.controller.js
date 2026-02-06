const mentorService = require("../services/mentor.service");
const ApiError = require("../helper/apiError");
const httpStatus = require("../util/httpStatus");

const getMentorInfoByUsername = async (req, res, next) => {
  const { username } = req.params;

  const mentor = await mentorService.getMentorByUsername(username);

  if (!mentor) {
    return next(new ApiError(httpStatus.notFound, "Mentor not found"));
  }

  console.log(`Fetching services for mentor: ${mentor._id} (${username})`);
  const services = await mentorService.getMentorServices(mentor._id);
  console.log(`Found ${services.length} active services for mentor ${username}`);

  res.status(httpStatus.ok).json({
    success: true,
    mentor,
    services,
  });
};

const getAllMentors = async (req, res, next) => {
  const mentors = await mentorService.getAllMentors();

  res.status(httpStatus.ok).json({
    success: true,
    mentors,
  });
};

module.exports = {
  getMentorInfoByUsername,
  getAllMentors,
};
