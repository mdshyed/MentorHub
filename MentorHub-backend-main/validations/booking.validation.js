const Joi = require("joi");

const initiateBookingValidation = Joi.object({
  serviceId: Joi.string().required(),
  dateAndTime: Joi.string().required(),
});

const verifyPaymentValidation = Joi.object({
  bookingId: Joi.string().required(),
  paymentId: Joi.string().required(),
  orderId: Joi.string().required(),
  signature: Joi.string().optional(),
});

module.exports = {
  initiateBookingValidation,
  verifyPaymentValidation,
};
