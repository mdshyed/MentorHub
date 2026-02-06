import React, { useState, useEffect } from "react";
import { Table, Spin } from "antd";
import Dashboard from "./dashboard";
import { MdOutlineCurrencyRupee } from "react-icons/md";
import booking from "../../apiManger/booking";
import moment from "moment";
import toast from "react-hot-toast";
import useUserStore from "../../store/user";

const Payment = () => {
  const { user } = useUserStore();
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMentor = user?.role === "mentor";

  useEffect(() => {
    if (user) {
      fetchPaymentHistory();
    }
  }, [user]);

  const fetchPaymentHistory = async () => {
    setLoading(true);
    try {
      const response = await booking.getPaymentHistory();
      const payments = response?.data?.payments || [];
      
      // Transform payments data for table
      const formattedPayments = payments.map((payment, index) => ({
        key: payment._id || index,
        no: index + 1,
        serviceName: payment.service?.name || "N/A",
        // For mentors, show student name; for students, show mentor name
        personName: isMentor 
          ? (payment.user?.name || "N/A")
          : (payment.mentor?.name || "N/A"),
        transactionId: payment.paymentId || payment.orderId || "N/A",
        date: moment(payment.createdAt).format("YYYY-MM-DD"),
        amount: `₹${payment.price}`,
        status: payment.status === "confirmed" ? "Completed" : payment.status,
      }));
      
      setPaymentHistory(formattedPayments);
    } catch (error) {
      console.error("Error fetching payment history:", error);
      toast.error("Failed to fetch payment history");
      setPaymentHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "No.",
      dataIndex: "no",
      key: "no",
      width: 60,
    },
    {
      title: "Service",
      dataIndex: "serviceName",
      key: "serviceName",
    },
    {
      title: isMentor ? "Student" : "Mentor",
      dataIndex: "personName",
      key: "personName",
    },
    {
      title: "Transaction ID",
      dataIndex: "transactionId",
      key: "transactionId",
      ellipsis: true,
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span
          className={`status ${
            status === "Completed" ? "text-green-500" : "text-red-500"
          }`}
        >
          {status}
        </span>
      ),
    },
  ];

  return (
    <Dashboard>
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <MdOutlineCurrencyRupee className="mr-2 text-3xl text-blue-600" />
            <h2 className="text-2xl font-bold">Payment History</h2>
          </div>
          {isMentor && paymentHistory.length > 0 && (
            <div className="text-lg font-semibold text-green-600">
              Total Earnings: ₹{paymentHistory.reduce((sum, payment) => {
                return sum + parseFloat(payment.amount.replace('₹', ''));
              }, 0)}
            </div>
          )}
        </div>
        
        <Spin spinning={loading}>
          {paymentHistory.length > 0 ? (
            <Table
              columns={columns}
              dataSource={paymentHistory}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ["5", "10", "20", "50"],
              }}
              className="w-full"
            />
          ) : (
            <div className="text-center py-10 text-gray-500">
              {loading ? (
                <Spin size="large" />
              ) : (
                <p>No payment history found. Your completed bookings will appear here.</p>
              )}
            </div>
          )}
        </Spin>
      </div>
    </Dashboard>
  );
};

export default Payment;
