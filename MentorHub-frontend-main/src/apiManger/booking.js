import AxiosInstances from ".";

const bookService = async (data) => {
  return await AxiosInstances.post("/booking/initiate-booking", data);
};
const getMentorBookings = async () => {
  return await AxiosInstances.get("/booking/mentor");
};
const getStudentBookigs = async () => {
  return await AxiosInstances.get("/booking/");
};

const verifyPayment = async (paymentData) => {
  return await AxiosInstances.post("/booking/verify-payment", paymentData);
};

const getPaymentHistory = async () => {
  return await AxiosInstances.get("/booking/payment-history");
};

const booking = {
  bookService,
  getMentorBookings,
  getStudentBookigs,
  verifyPayment,
  getPaymentHistory,
};

export default booking;
