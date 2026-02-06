const ApiError = require("../helper/apiError");
const availabilityService = require("../services/availability.service");
const httpStatus = require("../util/httpStatus");

const createAvailability = async (req, res, next) => {
  const userId = req.user._id;
  const availabilityData = req.body;

  const existingAvailability = await availabilityService.getAvailability(
    userId
  );

  if (existingAvailability) {
    // If availability exists, update it instead
    const updatedAvailability = await availabilityService.updateAvailability(
      userId,
      availabilityData
    );

    return res.status(httpStatus.ok).json({
      success: true,
      message: "Availability updated successfully",
      availability: updatedAvailability,
    });
  }

  const availability = await availabilityService.createAvailability(
    userId,
    availabilityData
  );

  res.status(httpStatus.created).json({
    success: true,
    message: "Availability created successfully",
    availability,
  });
};

const getAvailability = async (req, res, next) => {
  const userId = req.user._id;

  const availability = await availabilityService.getAvailability(userId);

  if (!availability) {
    return res.status(httpStatus.ok).json({
      success: true,
      availability: null,
    });
  }

  res.status(httpStatus.ok).json({
    success: true,
    availability,
  });
};

const updateAvailability = async (req, res, next) => {
  const userId = req.user._id;
  const availabilityData = req.body;

  const availability = await availabilityService.updateAvailability(
    userId,
    availabilityData
  );

  if (!availability) {
    return next(new ApiError(httpStatus.notFound, "Availability not found"));
  }

  res.status(httpStatus.ok).json({
    success: true,
    message: "Availability updated successfully",
    availability,
  });
};

const getNext14DaysAvailability = async (req, res, next) => {
  try {
    const mentorId = req.params.mentorId;
    // Support both 'duration' and 'durationInMinutes' query parameters
    const durationInMinutes = req.query.duration || req.query.durationInMinutes || 30;

    console.log(`Fetching availability for mentor: ${mentorId}, duration: ${durationInMinutes} minutes`);

    const availability =
      await availabilityService.getMentorAvailabilityForNext14Days(
        mentorId,
        durationInMinutes
      );

    // Ensure availability is always an array
    const availabilityArray = Array.isArray(availability) ? availability : [];

    console.log(`Returning ${availabilityArray.length} days of availability`);

    res.status(httpStatus.ok).json({
      success: true,
      availability: availabilityArray,
    });
  } catch (error) {
    console.error("Error in getNext14DaysAvailability:", error);
    return next(
      new ApiError(
        httpStatus.internalServerError,
        "Error fetching availability"
      )
    );
  }
};

module.exports = {
  createAvailability,
  getAvailability,
  updateAvailability,
  getNext14DaysAvailability,
};
