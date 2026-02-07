import React, { useEffect, useState } from "react";
import { Card, Button, Spin } from "antd";
import { FaClock } from "react-icons/fa";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { MdOutlineCurrencyRupee } from "react-icons/md";
import { useNavigate, useParams } from "react-router-dom";
import service from "../apiManger/service";
import availability from "../apiManger/availability";
import moment from "moment";
import booking from "../apiManger/booking";
import handlePayment from "../components/Checkout";
import Layout from "../components/Layout";

const Booking = () => {
  const navigate = useNavigate();
  const { username, id } = useParams();
  const [serviceData, setServiceData] = useState(null);
  const [mentorAvailability, setMentorAvailability] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingService, setLoadingService] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  const getServiceData = async () => {
    setLoadingService(true);
    const res = await service.getServiceById(id);
    setServiceData(res?.data?.service);
    getMentorAvailability(
      res?.data?.service?.mentor,
      res?.data?.service?.duration
    );
    setLoadingService(false);
  };

  const getMentorAvailability = async (id, duration) => {
    setLoadingAvailability(true);
    try {
      const res = await availability.getMentorAvailability(id, duration);
      console.log("Availability response:", res?.data);
      const availabilityData = res?.data?.availability;
      
      // Ensure it's an array
      if (Array.isArray(availabilityData)) {
        setMentorAvailability(availabilityData);
      } else {
        console.error("Availability is not an array:", availabilityData);
        setMentorAvailability([]);
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
      setMentorAvailability([]);
    } finally {
      setLoadingAvailability(false);
    }
  };

  useEffect(() => {
    getServiceData();
  }, [id]);

  const onBookServiceClick = async () => {
    try {
      const res = await booking.bookService({
        serviceId: id,
        dateAndTime: selectedSlot,
      });
      
      if (res?.data?.order?.id && res?.data?.booking?._id) {
        const bookingId = res.data.booking._id;
        const orderId = res.data.order.id;
        
        handlePayment(orderId, async (paymentResponse) => {
          console.log("Payment completed:", paymentResponse);
          setVerifyingPayment(true);

          try {
            const verifyRes = await booking.verifyPayment({
              bookingId: bookingId,
              paymentId: paymentResponse.razorpay_payment_id,
              orderId: orderId,
              signature: paymentResponse.razorpay_signature,
            });

            if (verifyRes?.data?.success) {
              console.log("Payment verified, booking confirmed:", verifyRes.data);
              navigate("/success", {
                state: {
                  emailSent: verifyRes.data.emailSent,
                  booking: verifyRes.data.booking,
                },
              });
            } else {
              setVerifyingPayment(false);
              alert("Payment completed but verification failed. Please contact support.");
              console.error("Payment verification failed:", verifyRes?.data);
            }
          } catch (verifyError) {
            setVerifyingPayment(false);
            console.error("Error verifying payment:", verifyError);
            const msg = verifyError.response?.data?.message || verifyError.message;
            alert("Payment completed but verification failed. " + (msg ? msg + ". " : "") + "Please contact support with payment ID: " + paymentResponse.razorpay_payment_id);
          }
        });
      } else {
        alert("Failed to create payment order. Please try again.");
      }
    } catch (error) {
      console.error("Error booking service:", error);
      alert(error.response?.data?.message || "Failed to book service. Please try again.");
    }
  };

  return (
    <Layout>
      <div className="container flex flex-col p-4 mx-auto md:flex-row md:space-x-4">
        <div className=" md:w-1/3">
          <Card className="text-white bg-blue-600">
            <div className="flex items-center mb-4">
              <AiOutlineArrowLeft className="mr-2 text-xl" />
              <h2 className="text-2xl font-bold">{serviceData?.name}</h2>
            </div>
            <div className="flex items-center mb-2">
              <MdOutlineCurrencyRupee className="mr-2 text-xl " />
              <span>{serviceData?.price}</span>
            </div>
            <div className="flex items-center mb-4">
              <FaClock className="mr-2" />
              <span>{serviceData?.duration} mins meeting</span>
            </div>
            <p>{serviceData?.description}</p>
          </Card>
        </div>
        <div className="md:w-2/3">
          <Card className="p-4">
            <h3 className="mb-2 text-lg font-semibold">Select Date</h3>
            {loadingAvailability ? (
              <div className="flex items-center justify-center h-full">
                <Spin size="large" />
              </div>
            ) : Array.isArray(mentorAvailability) && mentorAvailability.length > 0 ? (
              <div className="flex gap-2 my-6">
                {mentorAvailability.map((item, index) => (
                  <div
                    onClick={() => {
                      setActiveIndex(index);
                      setSelectedSlot(null);
                    }}
                    key={item.date || index}
                    className={`p-2 rounded-md cursor-pointer ${
                      activeIndex === index ? "bg-blue-600 text-white" : "bg-gray-200"
                    }`}
                  >
                    {moment(item.date).format("DD MMM")}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                <p>No availability slots found for this mentor.</p>
                <p className="text-sm mt-2">The mentor may need to set up their availability schedule.</p>
              </div>
            )}

            {activeIndex !== null && (
              <>
                <h3 className="mb-2 text-lg font-semibold">Select Time Slot</h3>
                <div className="flex gap-2 my-6 overflow-x-auto">
                  {mentorAvailability[activeIndex]?.slots?.map((slot) => (
                    <div
                      onClick={() => setSelectedSlot(slot.fullStart)}
                      key={slot.id}
                      className={`p-2 rounded-md cursor-pointer ${
                        selectedSlot === slot.fullStart ? "bg-blue-600" : ""
                      }`}
                    >
                      {slot.startTime}
                    </div>
                  ))}
                </div>
              </>
            )}

            <Button
              disabled={selectedSlot === null || verifyingPayment}
              type="primary"
              block
              size="large"
              loading={verifyingPayment}
              onClick={onBookServiceClick}
            >
              {verifyingPayment ? "Verifying payment…" : "Book Session"}
            </Button>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Booking;
