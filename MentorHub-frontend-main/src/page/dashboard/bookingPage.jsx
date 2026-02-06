import React, { useEffect, useState } from "react";
import { Table, Button, Spin } from "antd";
import moment from "moment";
import Layout from "../../components/Layout";
import booking from "../../apiManger/booking";
import useUserStore from "../../store/user";

const Booking = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming"); // 'upcoming' or 'past'
  const { user } = useUserStore();

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let res;
      if (user?.role === "mentor") {
        res = await booking.getMentorBookings();
      } else {
        res = await booking.getStudentBookigs();
      }
      setBookings(res?.data?.bookings || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handlePayNow = (bookingId) => {
    // handle payment logic for the booking
  };

  // Filter bookings based on active tab
  const filteredBookings = bookings.filter((booking) => {
    if (activeTab === "upcoming") {
      return moment(booking.dateAndTime).isAfter(moment()); // Future bookings
    } else {
      return moment(booking.dateAndTime).isBefore(moment()); // Past bookings
    }
  });

  const columns = [
    {
      title: "Date",
      dataIndex: "dateAndTime",
      key: "dateAndTime",
      render: (text) => moment(text).format("DD MMM YYYY, hh:mm A"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price) => `₹${price}`,
    },
    {
      title: "Action",
      key: "action",
      render: (text, record) =>
        record.status === "pending" ? (
          <Button type="primary" onClick={() => handlePayNow(record._id)}>
            Pay Now
          </Button>
        ) : null,
    },
  ];

  return (
    <Layout>
      <div className="container p-4 mx-auto">
        <h2 className="text-2xl font-bold">Your Bookings</h2>
        <div className="flex my-4 space-x-4">
          <Button
            type={activeTab === "upcoming" ? "primary" : "default"}
            onClick={() => setActiveTab("upcoming")}
          >
            Upcoming Bookings
          </Button>
          <Button
            type={activeTab === "past" ? "primary" : "default"}
            onClick={() => setActiveTab("past")}
          >
            Past Bookings
          </Button>
        </div>

        {loading ? (
          <Spin size="large" />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredBookings}
            pagination={{ pageSize: 5 }}
            rowKey={(record) => record._id}
          />
        )}
      </div>
    </Layout>
  );
};

export default Booking;
