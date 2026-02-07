import React, { useState, useEffect } from "react";
import { Button, Form, TimePicker, Card, Spin } from "antd";
import moment from "moment";
import Dashboard from "./dashboard";
import availabilityAPI from "../../apiManger/availability";
import useUserStore from "../../store/user";
import toast from "react-hot-toast";

const Schedule = () => {
  const { user } = useUserStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [existingAvailability, setExistingAvailability] = useState(null);

  const daysOfWeek = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ];

  useEffect(() => {
    if (user?.role === "mentor") {
      fetchAvailability();
    } else {
      setFetching(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchAvailability = async () => {
    setFetching(true);
    try {
      const response = await availabilityAPI.getAvailability();
      if (response?.data?.availability) {
        setExistingAvailability(response.data.availability);
        // Populate form with existing data
        const weeklyAvailability = response.data.availability.weeklyAvailability || {};
        const formData = {};
        
        daysOfWeek.forEach((day) => {
          const daySlots = weeklyAvailability[day.key] || [];
          formData[day.key] = daySlots.map((slot) => ({
            startTime: moment(slot.startTime, "HH:mm"),
            endTime: moment(slot.endTime, "HH:mm"),
          }));
        });

        form.setFieldsValue(formData);
      }
    } catch (error) {
      console.log("No existing availability found, will create new one");
    } finally {
      setFetching(false);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Convert moment objects to time strings
      const weeklyAvailability = {};
      daysOfWeek.forEach((day) => {
        const slots = values[day.key] || [];
        weeklyAvailability[day.key] = slots.map((slot) => ({
          startTime: slot.startTime.format("HH:mm"),
          endTime: slot.endTime.format("HH:mm"),
        }));
      });

      const availabilityData = {
        weeklyAvailability,
        unavailableDates: values.unavailableDates || [],
      };

      if (existingAvailability) {
        // Update existing availability
        await availabilityAPI.updateAvailability(availabilityData);
        toast.success("Availability updated successfully!");
      } else {
        // Create new availability
        await availabilityAPI.createAvailability(availabilityData);
        toast.success("Availability created successfully!");
        await fetchAvailability(); // Refresh to get the created availability
      }
    } catch (error) {
      console.error("Error saving availability:", error);
      toast.error(
        error.response?.data?.message || "Failed to save availability. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== "mentor") {
    return (
      <Dashboard>
        <div className="p-6">
          <div className="text-center text-lg text-gray-600 mt-10">
            This page is only accessible to mentors.
          </div>
        </div>
      </Dashboard>
    );
  }

  return (
    <Dashboard>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Set Your Availability</h2>
        <p className="text-gray-600 mb-6">
          Set your weekly availability schedule. Students will be able to book sessions during these times.
        </p>

        {fetching ? (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" />
          </div>
        ) : (
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={{
                monday: [{ startTime: moment("09:00", "HH:mm"), endTime: moment("17:00", "HH:mm") }],
                tuesday: [{ startTime: moment("09:00", "HH:mm"), endTime: moment("17:00", "HH:mm") }],
                wednesday: [{ startTime: moment("09:00", "HH:mm"), endTime: moment("17:00", "HH:mm") }],
                thursday: [{ startTime: moment("09:00", "HH:mm"), endTime: moment("17:00", "HH:mm") }],
                friday: [{ startTime: moment("09:00", "HH:mm"), endTime: moment("17:00", "HH:mm") }],
                saturday: [],
                sunday: [],
              }}
            >
              {daysOfWeek.map((day) => (
                <Form.Item
                  key={day.key}
                  label={day.label}
                  name={day.key}
                >
                  <Form.List name={day.key}>
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...restField }) => (
                          <div key={key} className="flex gap-4 mb-4 items-end">
                            <Form.Item
                              {...restField}
                              name={[name, "startTime"]}
                              label="Start Time"
                              className="flex-1"
                              rules={[{ required: true, message: "Please select start time" }]}
                            >
                              <TimePicker
                                format="HH:mm"
                                className="w-full"
                                placeholder="Start Time"
                              />
                            </Form.Item>
                            <Form.Item
                              {...restField}
                              name={[name, "endTime"]}
                              label="End Time"
                              className="flex-1"
                              rules={[{ required: true, message: "Please select end time" }]}
                            >
                              <TimePicker
                                format="HH:mm"
                                className="w-full"
                                placeholder="End Time"
                              />
                            </Form.Item>
                            <Button
                              type="link"
                              danger
                              onClick={() => remove(name)}
                              className="mb-1"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="dashed"
                          onClick={() => add()}
                          block
                          className="mb-4"
                        >
                          + Add Time Slot
                        </Button>
                      </>
                    )}
                  </Form.List>
                </Form.Item>
              ))}

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} size="large">
                  {existingAvailability ? "Update Availability" : "Save Availability"}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">💡 Tips:</h3>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Add multiple time slots per day if you have breaks in your schedule</li>
            <li>Leave days empty if you're not available on those days</li>
            <li>Your availability will be used to generate booking slots for students</li>
            <li>You can update your availability at any time</li>
          </ul>
        </div>
      </div>
    </Dashboard>
  );
};

export default Schedule;
