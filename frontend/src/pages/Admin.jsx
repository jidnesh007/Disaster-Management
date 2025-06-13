import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Admin = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || {}
  );
  const [volunteers, setVolunteers] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    locationName: "",
    latitude: "",
    longitude: "",
    assignedVolunteerIds: [],
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchVolunteers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/rescue/available-volunteers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setVolunteers(data.data);
      } else {
        setMessage(data.message || "Failed to fetch volunteers");
      }
    } catch (error) {
      console.error("Fetch volunteers error:", error);
      setMessage("Network error");
    }
  };

  const handleCreateOperation = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/rescue/operations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          location: {
            name: formData.locationName,
            coordinates: [
              parseFloat(formData.longitude),
              parseFloat(formData.latitude),
            ],
          },
          assignedVolunteerIds: formData.assignedVolunteerIds,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setMessage("Operation created successfully");
        setFormData({
          title: "",
          locationName: "",
          latitude: "",
          longitude: "",
          assignedVolunteerIds: [],
        });
      } else {
        setMessage(data.message || "Failed to create operation");
      }
    } catch (error) {
      console.error("Create operation error:", error);
      setMessage("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVolunteerToggle = (volunteerId) => {
    setFormData((prev) => ({
      ...prev,
      assignedVolunteerIds: prev.assignedVolunteerIds.includes(volunteerId)
        ? prev.assignedVolunteerIds.filter((id) => id !== volunteerId)
        : [...prev.assignedVolunteerIds, volunteerId],
    }));
  };

  useEffect(() => {
    if (user.role !== "admin") {
      navigate("/");
    } else {
      fetchVolunteers();
    }
  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white p-6 rounded-md shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mb-6">Welcome, {user.name || "Admin"}!</p>

        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Create Rescue Operation
        </h2>
        <form onSubmit={handleCreateOperation} className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-600"
            >
              Operation Title
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              placeholder="Enter operation title"
              required
            />
          </div>
          <div>
            <label
              htmlFor="locationName"
              className="block text-sm font-medium text-gray-600"
            >
              Location Name
            </label>
            <input
              id="locationName"
              type="text"
              value={formData.locationName}
              onChange={(e) =>
                setFormData({ ...formData, locationName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              placeholder="Enter location name"
              required
            />
          </div>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label
                htmlFor="latitude"
                className="block text-sm font-medium text-gray-600"
              >
                Latitude
              </label>
              <input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) =>
                  setFormData({ ...formData, latitude: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="Enter latitude"
                required
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="longitude"
                className="block text-sm font-medium text-gray-600"
              >
                Longitude
              </label>
              <input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) =>
                  setFormData({ ...formData, longitude: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="Enter longitude"
                required
              />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Assign Volunteers
            </h3>
            {volunteers.length === 0 ? (
              <p className="text-sm text-gray-600">No available volunteers.</p>
            ) : (
              <div className="space-y-2">
                {volunteers.map((volunteer) => (
                  <label
                    key={volunteer._id}
                    className="block flex items-center"
                  >
                    <input
                      type="checkbox"
                      checked={formData.assignedVolunteerIds.includes(
                        volunteer._id
                      )}
                      onChange={() => handleVolunteerToggle(volunteer._id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      {volunteer.name} ({volunteer.email})
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating..." : "Create Operation"}
          </button>
        </form>

        {message && (
          <p
            className={`mt-4 text-sm ${
              message.includes("success") ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}

        <button
          onClick={handleLogout}
          className="mt-6 w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Admin;
