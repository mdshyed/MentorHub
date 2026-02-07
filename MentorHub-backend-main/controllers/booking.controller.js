const Razorpay = require("razorpay");
const bookingService = require("../services/booking.service");
const httpStatus = require("../util/httpStatus");
const serviceService = require("../services/service.service");
const config = require("../config");

const initiateBookingAndPayment = async (req, res, next) => {
  const { dateAndTime, serviceId } = req.body;

  if (!config.razorpay?.key_id || !config.razorpay?.key_secret) {
    return res.status(httpStatus.internalServerError).json({
      success: false,
      message: "Payment gateway not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env",
    });
  }

  const service = await serviceService.getServiceById(serviceId);

  // Create a new booking
  const newBooking = await bookingService.createBooking({
    user: req.user._id,
    mentor: service.mentor,
    dateAndTime,
    service: serviceId,
    price: service.price,
  });

  // Initialize Razorpay instance
  const razorpay = new Razorpay(config.razorpay);

  // Create an order in Razorpay
  const options = {
    amount: service.price * 100, // amount in the smallest currency unit
    currency: "INR",
    receipt: `receipt_order_${newBooking._id}`,
    payment_capture: 1,
    notes: {
      bookingId: newBooking._id,
    },
  };

  const order = await razorpay.orders.create(options);

  // Send response with booking and payment details
  res.status(httpStatus.created).json({
    booking: newBooking,
    order,
  });
};

const getBookings = async (req, res, next) => {
  const bookings = await bookingService.getUsersBooking(req.user._id);
  res.status(httpStatus.ok).json({ success: true, bookings });
};

const getMentorBookings = async (req, res, next) => {
  const bookings = await bookingService.getMentorBookings(req.user._id);
  res.status(httpStatus.ok).json({ success: true, bookings });
};

const getPaymentHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    
    console.log(`Fetching payment history for user: ${userId}, role: ${userRole}`);
    
    // If user is a mentor, get payments for their services
    // If user is a student, get payments for their bookings
    let payments;
    if (userRole === "mentor") {
      payments = await bookingService.getMentorPaymentHistory(userId);
      console.log(`Found ${payments.length} payments for mentor ${userId}`);
    } else {
      payments = await bookingService.getPaymentHistory(userId);
      console.log(`Found ${payments.length} payments for student ${userId}`);
    }
    
    res.status(httpStatus.ok).json({ success: true, payments });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return res.status(httpStatus.internalServerError).json({
      success: false,
      message: "Error fetching payment history",
    });
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { bookingId, paymentId, orderId, signature } = req.body;

    if (!bookingId || !paymentId || !orderId) {
      return res.status(httpStatus.badRequest).json({
        success: false,
        message: "Missing payment details",
      });
    }

    // Get the booking
    const booking = await bookingService.getBookingById(bookingId);

    if (!booking) {
      return res.status(httpStatus.notFound).json({
        success: false,
        message: "Booking not found",
      });
    }

    // If booking is already confirmed, return success
    if (booking.status === "confirmed") {
      return res.status(httpStatus.ok).json({
        success: true,
        message: "Payment already verified",
        booking,
      });
    }

    // Verify payment with Razorpay (optional - for production)
    if (!config.razorpay?.key_id || !config.razorpay?.key_secret) {
      return res.status(httpStatus.internalServerError).json({
        success: false,
        message: "Payment gateway not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env",
      });
    }
    const RazorpayInstance = new Razorpay(config.razorpay);
    
    try {
      // Fetch payment details from Razorpay
      const payment = await RazorpayInstance.payments.fetch(paymentId);
      
      if (payment.status === "captured" || payment.status === "authorized") {
        // Payment is successful, update booking
        const duration = booking.service?.duration ?? 30;
        const zoomMeeting = await require("../services/zoom.service").createScheduledZoomMeeting(
          booking.dateAndTime,
          duration
        );

        const updatedBooking = await bookingService.updateBookingById(bookingId, {
          meetingLink: zoomMeeting,
          status: "confirmed",
          paymentId: paymentId,
          orderId: orderId,
        });

        // Send confirmation email in background (don't block response)
        const updatedBookingWithUser = await bookingService.getBookingById(bookingId);
        const userEmail = updatedBookingWithUser?.user?.email;
        const userName = updatedBookingWithUser?.user?.name || "User";
        if (userEmail) {
          require("../services/email.service")
            .sendConfirmationMail(
              userEmail,
              userName,
              zoomMeeting,
              require("moment")(booking.dateAndTime).format("DD-MM-YYYY"),
              require("moment")(booking.dateAndTime).format("HH:mm")
            )
            .catch((err) => console.error("Error sending confirmation email:", err));
        }

        const confirmedBooking = await bookingService.getBookingById(bookingId);
        return res.status(httpStatus.ok).json({
          success: true,
          message: "Payment verified and booking confirmed",
          booking: confirmedBooking,
          emailSent: !!userEmail,
        });
      } else {
        return res.status(httpStatus.badRequest).json({
          success: false,
          message: "Payment not successful",
        });
      }
    } catch (razorpayError) {
      console.error("Error verifying payment with Razorpay:", razorpayError);
      // For development, if Razorpay verification fails, still confirm the booking
      // In production, you should handle this more strictly
      if (process.env.NODE_ENV === "development") {
        console.log("Development mode: Confirming booking without Razorpay verification");
        const duration = booking.service?.duration ?? 30;
        const zoomMeeting = await require("../services/zoom.service").createScheduledZoomMeeting(
          booking.dateAndTime,
          duration
        );

        await bookingService.updateBookingById(bookingId, {
          meetingLink: zoomMeeting,
          status: "confirmed",
          paymentId: paymentId,
          orderId: orderId,
        });

        // Send confirmation email in background (don't block response)
        const updatedBookingWithUser = await bookingService.getBookingById(bookingId);
        const userEmail = updatedBookingWithUser?.user?.email;
        const userName = updatedBookingWithUser?.user?.name || "User";
        if (userEmail) {
          require("../services/email.service")
            .sendConfirmationMail(
              userEmail,
              userName,
              zoomMeeting,
              require("moment")(booking.dateAndTime).format("DD-MM-YYYY"),
              require("moment")(booking.dateAndTime).format("HH:mm")
            )
            .catch((err) => console.error("Error sending confirmation email:", err));
        }

        return res.status(httpStatus.ok).json({
          success: true,
          message: "Payment verified and booking confirmed (dev mode)",
          booking: await bookingService.getBookingById(bookingId),
          emailSent: !!userEmail,
        });
      } else {
        return res.status(httpStatus.badRequest).json({
          success: false,
          message: "Payment verification failed",
        });
      }
    }
  } catch (error) {
    console.error("Error in verifyPayment:", error);
    return res.status(httpStatus.internalServerError).json({
      success: false,
      message: "Error verifying payment",
    });
  }
};

module.exports = {
  initiateBookingAndPayment,
  getBookings,
  getMentorBookings,
  verifyPayment,
  getPaymentHistory,
};
