import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "../components/Layout";
import moment from "moment";

const SuccessPage = () => {
  const [countdown, setCountdown] = useState(10);
  const navigate = useNavigate();
  const location = useLocation();
  const emailSent = location.state?.emailSent;
  const booking = location.state?.booking;

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 0 ? 0 : prev - 1));
    }, 1000);
    if (countdown === 0) {
      navigate("/");
    }
    return () => clearInterval(timer);
  }, [countdown, navigate]);

  const meetingLink = booking?.meetingLink;
  const dateAndTime = booking?.dateAndTime;
  const serviceName = booking?.service?.name;

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[80vh] bg-gray-100 px-4">
        <div className="w-full max-w-md p-8 text-center bg-white rounded-xl shadow-lg">
          {/* Success icon */}
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-green-600">Payment successful!</h1>
          <p className="mt-2 text-lg font-medium text-gray-800">Your payment was successful.</p>
          <p className="mt-1 text-gray-600">Your booking has been confirmed.</p>

          {serviceName && (
            <p className="mt-3 text-gray-700">
              <span className="font-medium">Session:</span> {serviceName}
            </p>
          )}
          {dateAndTime && (
            <p className="text-gray-700">
              <span className="font-medium">Date & time:</span> {moment(dateAndTime).format("DD MMM YYYY, hh:mm A")}
            </p>
          )}

          {meetingLink && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Join your meeting with this link:</p>
              <a
                href={meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline break-all font-medium"
              >
                {meetingLink}
              </a>
            </div>
          )}

          <p className="mt-4 text-sm text-gray-500">
            {emailSent === true
              ? "A confirmation email with the meeting link has been sent to your registered email."
              : emailSent === false
                ? "Check your bookings for the meeting link. If you expected an email, check spam or contact support."
                : booking
                  ? "Check your email or bookings for the meeting link."
                  : "Check your bookings or email for the meeting link."}
          </p>

          <div className="mt-6">
            <p className="text-sm text-blue-600 font-medium">Redirecting in {countdown} seconds…</p>
            <div className="mt-2 w-12 h-12 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate("/user-bookings")}
              className="px-5 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-500 font-medium"
            >
              View my bookings
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-5 py-2.5 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SuccessPage;
