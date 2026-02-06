import React, { useEffect, useState } from "react";
import Dashboard from "./dashboard";
import ServiceCard from "../../components/ServiceCard";
import service from "../../apiManger/service";
import { Button, Input, Modal, Form, Spin, Alert, Switch } from "antd"; // Ant Design components for form, modal, and message
import toast from "react-hot-toast";
import { FiPlus } from "react-icons/fi";
import useUserStore from "../../store/user";

const Services = () => {
  const [services, setServices] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false); // Modal visibility state
  const [editingService, setEditingService] = useState(null); // State for the service being edited
  const [loading, setLoading] = useState(true); // Loading state
  const { user } = useUserStore();

  // Fetch all services
  useEffect(() => {
    const fetchServices = async () => {
      // Only fetch if user is a mentor
      if (user?.role !== "mentor") {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await service.getAllServices(); // Handle async call
        setServices(response?.data?.services || []);
      } catch (error) {
        console.error("Error fetching services:", error);
        toast.error("Failed to fetch services");
      } finally {
        setLoading(false);
      }
    };

    fetchServices(); // Call the function to fetch services
  }, [user?.role]);

  // Handle form submission to create a new service
  const handleCreateService = async (values) => {
    setLoading(true);
    try {
      const response = await service.createService(values);
      setServices((prevServices) => [...prevServices, response?.data?.service]); // Add new service to the list
      setIsModalVisible(false); // Close the modal after creating service
      toast.success("Service created successfully!");
    } catch (error) {
      console.error("Error creating service:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission to edit an existing service
  const handleEditService = async (values) => {
    setLoading(true);
    try {
      const response = await service.editService(editingService._id, values);
      setServices((prevServices) =>
        prevServices.map((servic) =>
          servic._id === editingService._id ? response.data.service : servic
        )
      ); // Update the edited service in the list
      setIsModalVisible(false); // Close the modal after editing service
      setEditingService(null); // Reset editing state
      toast.success("Service updated successfully!");
    } catch (error) {
      console.error("Error editing service:", error);
      toast.error("Failed to update service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service); // Set the selected service for editing
    setIsModalVisible(true); // Open the modal for editing
  };

  // Handle toggle service active status
  const handleToggleActive = async (service) => {
    try {
      setLoading(true);
      const response = await service.editService(service._id, {
        ...service,
        active: !service.active, // Toggle active status
      });
      setServices((prevServices) =>
        prevServices.map((servic) =>
          servic._id === service._id ? response.data.service : servic
        )
      );
      toast.success(
        `Service ${!service.active ? "activated" : "deactivated"} successfully!`
      );
    } catch (error) {
      console.error("Error toggling service status:", error);
      toast.error("Failed to update service status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show message if user is not a mentor
  if (user?.role !== "mentor") {
    return (
      <Dashboard>
        <div className="p-6">
          <Alert
            message="Access Restricted"
            description="This page is only available for mentors. Please sign up as a mentor to manage services."
            type="warning"
            showIcon
          />
        </div>
      </Dashboard>
    );
  }

  return (
    <Dashboard>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Your Services</h2>

          {/* Button to open the modal for creating a new service */}
          <Button
            className="!rounded "
            type="primary"
            onClick={() => setIsModalVisible(true)}
          >
            <FiPlus className="inline-block mr-2" /> Add New
          </Button>
        </div>

        {/* Form modal for creating or editing a service */}
        <Modal
          title={editingService ? "Edit Service" : "Create New Service"}
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            setEditingService(null); // Reset editing state if modal is closed
          }}
          footer={null}
        >
          <Form
            onFinish={editingService ? handleEditService : handleCreateService}
            initialValues={editingService} // Prefill form with service data if editing
          >
            <Form.Item
              label="Name"
              name="name"
              rules={[
                { required: true, message: "Please enter the service name!" },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Description"
              name="description"
              rules={[
                {
                  required: true,
                  message: "Please enter the service description!",
                },
              ]}
            >
              <Input.TextArea />
            </Form.Item>
            <Form.Item
              label="Duration"
              name="duration"
              rules={[
                {
                  required: true,
                  message: "Please enter the service duration!",
                },
              ]}
            >
              <Input type="number" />
            </Form.Item>
            <Form.Item
              label="Price"
              name="price"
              rules={[
                { required: true, message: "Please enter the service price!" },
              ]}
            >
              <Input type="number" />
            </Form.Item>
            {editingService && (
              <Form.Item
                label="Active"
                name="active"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            )}
            <Button type="primary" htmlType="submit">
              {editingService ? "Save Changes" : "Create Service"}
            </Button>
          </Form>
        </Modal>

        {/* Display services in a grid */}
        <Spin spinning={loading}>
          <div className="grid grid-cols-1 gap-6 mt-6 md:grid-cols-2 lg:grid-cols-3">
            {services?.map((servic) => (
              <ServiceCard
                key={servic._id}
                service={servic}
                onEdit={() => handleEdit(servic)} // Pass the service to the edit function
                onToggleActive={() => handleToggleActive(servic)} // Pass toggle handler
              />
            ))}
          </div>
        </Spin>
      </div>
    </Dashboard>
  );
};

export default Services;
