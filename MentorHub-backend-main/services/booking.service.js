const BookingModel = require("../models/booking.model");

const createBooking = async (bookingData) => {
  return await BookingModel.create(bookingData);
};

const getBookingById = async (bookingId) => {
  return await BookingModel.findById(bookingId)
    .populate("service")
    .populate("user", "name email")
    .populate("mentor", "name email");
};

const updateBookingById = async (bookingId, bookingData) => {
  const updated = await BookingModel.findByIdAndUpdate(bookingId, bookingData, {
    new: true,
  });
  // Return populated booking
  return await BookingModel.findById(bookingId)
    .populate("service")
    .populate("user", "name email")
    .populate("mentor", "name email");
};

const getUsersBooking = async (userId) => {
  return await BookingModel.find({ user: userId });
};

const getMentorBookings = async (mentorId) => {
  return await BookingModel.find({ mentor: mentorId })
    .populate("user", "name email")
    .populate("service", "name price duration");
};

const getPaymentHistory = async (userId) => {
  // Get confirmed bookings with payment info (for students - bookings they made)
  return await BookingModel.find({ 
    user: userId,
    status: "confirmed",
    paymentId: { $exists: true, $ne: null }
  })
    .populate("service", "name")
    .populate("mentor", "name")
    .sort({ createdAt: -1 });
};

const getMentorPaymentHistory = async (mentorId) => {
  // Get confirmed bookings with payment info (for mentors - bookings for their services)
  return await BookingModel.find({ 
    mentor: mentorId,
    status: "confirmed",
    paymentId: { $exists: true, $ne: null }
  })
    .populate("service", "name")
    .populate("user", "name email")
    .sort({ createdAt: -1 });
};

module.exports = {
  createBooking,
  getBookingById,
  updateBookingById,
  getUsersBooking,
  getMentorBookings,
  getPaymentHistory,
  getMentorPaymentHistory,
};
