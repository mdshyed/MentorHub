import React, { useEffect, useState } from "react";
import { Spin } from "antd"; // Import the Spin component from antd
import useMentorStore from "../store/mentors";
import MentorCard from "../components/MentorCard";
import mentorAPI from "../apiManger/mentor";
import Layout from "../components/Layout";

const AllMentors = () => {
  const { mentorsData, setMentorsData } = useMentorStore();
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState(null);

  // Fetch mentors when the component mounts
  useEffect(() => {
    const fetchAllMentors = async () => {
      setLoading(true); // Start loading
      setError(null); // Clear any previous errors
      try {
        console.log("Fetching mentors...");
        const response = await mentorAPI.getAllMentors();
        console.log("Mentors response:", response?.data);
        const allMentors = response?.data?.mentors || [];
        setMentorsData(allMentors); // Store all mentors in the Zustand store
        if (allMentors.length === 0) {
          setError("No mentors found. Please check back later.");
        }
      } catch (error) {
        console.error("Error fetching mentors:", error);
        setError(error.response?.data?.message || "Failed to load mentors. Please try again.");
      } finally {
        setLoading(false); // Stop loading once the request completes
      }
    };

    fetchAllMentors();
  }, [setMentorsData]); // Remove mentorsData from dependencies to always fetch fresh data

  return (
    <Layout>
      <div className="container mx-auto my-10">
        <h2 className="mb-8 text-3xl font-bold text-center">
          Book Your Session Now
        </h2>

        <div className="flex justify-center mb-20">
          <input
            className="w-1/2 p-2 border border-gray-400 rounded outline-none"
            type="text"
            placeholder="Search here..."
          />
        </div>

        {/* Loading Indicator */}
        {loading ? (
          <div className="flex flex-col items-center justify-center my-10">
            <Spin size="large" />
            <p className="mt-4 text-gray-600">Loading mentors...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center my-10">
            <p className="text-red-600 text-lg">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-800"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
            {mentorsData.length > 0 ? (
              mentorsData.map((mentor) => (
                <MentorCard key={mentor?._id} mentor={mentor} />
              ))
            ) : (
              <p className="col-span-4 text-center text-gray-600">
                No mentors available at the moment.
              </p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AllMentors;
