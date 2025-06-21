import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  AlertTriangle,
  Package,
  TrendingDown,
  TrendingUp,
  MapPin,
  Edit3,
  Trash2,
  Eye,
  RefreshCw,
  Download,
  Bell,
} from "lucide-react";
import axios from "axios";

// Create Axios instance with proxy base URL
const api = axios.create({
  baseURL: "/api",
});

// Add JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const { code } = error.response.data;
      if (
        [
          "NO_TOKEN",
          "USER_NOT_FOUND",
          "ACCOUNT_DEACTIVATED",
          "INVALID_TOKEN",
        ].includes(code)
      ) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      if (code === "TOKEN_EXPIRED") {
        localStorage.removeItem("token");
        window.location.href = "/login?expired=true";
      }
    }
    return Promise.reject(error);
  }
);

const Resource = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    status: "",
    facilityId: "",
    isUrgent: "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });
  const [statistics, setStatistics] = useState({
    totalResources: 0,
    urgentItems: 0,
    categoryBreakdown: [],
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [stockOperation, setStockOperation] = useState({
    quantity: "",
    operation: "add",
  });
  const [newResource, setNewResource] = useState({
    name: "",
    category: "food",
    description: "",
    unit: "pieces",
    currentStock: 0,
    minimumThreshold: 10,
    location: {
      facilityId: "",
      facilityName: "",
      address: "",
      coordinates: { lat: 0, lng: 0 },
    },
    expiryDate: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [facilitiesError, setFacilitiesError] = useState("");

  const categories = [
    { value: "food", label: "Food", icon: "🍽️" },
    { value: "water", label: "Water", icon: "💧" },
    { value: "clothing", label: "Clothing", icon: "👕" },
    { value: "medicine", label: "Medicine", icon: "💊" },
    { value: "shelter", label: "Shelter", icon: "🏠" },
    { value: "medical_equipment", label: "Medical Equipment", icon: "🏥" },
    { value: "other", label: "Other", icon: "📦" },
  ];

  const units = [
    "kg",
    "liters",
    "pieces",
    "boxes",
    "bottles",
    "packets",
    "units",
  ];
  const statuses = ["available", "low_stock", "out_of_stock", "expired"];

  // Fetch facilities for dropdown
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const response = await api.get("/facilities");
        setFacilities(response.data.data || []);
        setFacilitiesError("");
      } catch (error) {
        const errorDetails = error.response
          ? { status: error.response.status, data: error.response.data }
          : { message: error.message };
        console.error("Error fetching facilities:", errorDetails);
        setFacilitiesError(
          "Failed to load facilities. Please try again later."
        );
        setFacilities([]);
      }
    };
    fetchFacilities();
  }, []);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        const params = {
          page: pagination.currentPage,
          limit: pagination.itemsPerPage,
        };
        if (filters.category) params.category = filters.category;
        if (filters.status) params.status = filters.status;
        if (filters.facilityId) params.facilityId = filters.facilityId;
        if (filters.isUrgent) params.isUrgent = filters.isUrgent;

        console.log("Fetching URL:", `/api/resources`, {
          params,
          token: localStorage.getItem("token"),
        });
        const response = await api.get("/resources", { params });
        console.log("Fetch Response:", response.data);
        const {
          resources,
          pagination: pageData,
          statistics: stats,
        } = response.data.data;
        setResources(resources);
        setPagination(pageData);
        setStatistics(stats);
      } catch (error) {
        const errorDetails = error.response
          ? { status: error.response.status, data: error.response.data }
          : { message: error.message };
        console.log("Fetch Error:", errorDetails);
        setErrorMessage(
          error.response?.data?.message ||
            "Failed to fetch resources. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [filters, pagination.currentPage]);

  const getStatusColor = (status) => {
    const colors = {
      available: "bg-green-100 text-green-800",
      low_stock: "bg-yellow-100 text-yellow-800",
      out_of_stock: "bg-red-100 text-red-800",
      expired: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getCategoryIcon = (category) => {
    const categoryObj = categories.find((cat) => cat.value === category);
    return categoryObj ? categoryObj.icon : "📦";
  };

  const handleAddResource = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      setErrorMessage("");
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("Please log in to add resources.");
        window.location.href = "/login";
        return;
      }
      // Validate required fields
      if (!newResource.name || !newResource.category || !newResource.unit) {
        setErrorMessage(
          "Please fill in all required fields: name, category, unit."
        );
        return;
      }
      if (
        !newResource.location.facilityId ||
        !newResource.location.facilityName ||
        !newResource.location.address
      ) {
        setErrorMessage(
          "Please select a facility and provide facility name and address."
        );
        return;
      }
      // Ensure coordinates are numbers
      const resourcePayload = {
        ...newResource,
        location: {
          ...newResource.location,
          coordinates: {
            lat: parseFloat(newResource.location.coordinates.lat) || 0,
            lng: parseFloat(newResource.location.coordinates.lng) || 0,
          },
        },
      };
      console.log("Posting Resource:", { resourcePayload, token });
      const response = await api.post("/resources", resourcePayload);
      console.log("Post Response:", response.data);
      setResources((prev) => [response.data.data, ...prev]);
      setShowAddModal(false);
      setNewResource({
        name: "",
        category: "food",
        description: "",
        unit: "pieces",
        currentStock: 0,
        minimumThreshold: 10,
        location: {
          facilityId: "",
          facilityName: "",
          address: "",
          coordinates: { lat: 0, lng: 0 },
        },
        expiryDate: "",
      });
    } catch (error) {
      const errorDetails = error.response
        ? { status: error.response.status, data: error.response.data }
        : { message: error.message };
      console.log("Post Error:", errorDetails);
      if (error.response?.data?.code === "INSUFFICIENT_PERMISSIONS") {
        setErrorMessage("You don't have permission to add resources.");
      } else {
        setErrorMessage(
          error.response?.data?.message || "Failed to add resource."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStockUpdate = async () => {
    if (!selectedResource || !stockOperation.quantity) return;
    try {
      setErrorMessage("");
      const response = await api.patch(
        `/resources/${selectedResource._id}/stock`,
        {
          quantity: parseInt(stockOperation.quantity),
          operation: stockOperation.operation,
        }
      );
      setResources((prev) =>
        prev.map((resource) =>
          resource._id === selectedResource._id ? response.data.data : resource
        )
      );
      setShowStockModal(false);
      setSelectedResource(null);
      setStockOperation({ quantity: "", operation: "add" });
    } catch (error) {
      const errorDetails = error.response
        ? { status: error.response.status, data: error.response.data }
        : { message: error.message };
      console.log("Stock Update Error:", errorDetails);
      setErrorMessage(
        error.response?.data?.message || "Failed to update stock."
      );
    }
  };

  const handleDeleteResource = async (resourceId) => {
    try {
      setErrorMessage("");
      await api.delete(`/resources/${resourceId}`);
      setResources((prev) =>
        prev.filter((resource) => resource._id !== resourceId)
      );
    } catch (error) {
      const errorDetails = error.response
        ? { status: error.response.status, data: error.response.data }
        : { message: error.message };
      console.log("Delete Error:", errorDetails);
      setErrorMessage(
        error.response?.data?.message || "Failed to delete resource."
      );
    }
  };

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.location.facilityName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {errorMessage}
          </div>
        )}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Resource Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage disaster relief resources and inventory
              </p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Resource
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Resources
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics.totalResources}
                  </p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Urgent Items
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {statistics.urgentItems}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-6 text-red-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Categories
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {statistics.categoryBreakdown.length}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Stock</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {resources.filter((r) => r.status === "low_stock").length}
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search resources or facilities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <select
                  value={filters.category}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Statuses</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status
                        .replace("_", " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.isUrgent}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      isUrgent: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Items</option>
                  <option value="true">Urgent Only</option>
                  <option value="false">Non-Urgent</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResources.map((resource) => (
                  <tr key={resource._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">
                          {getCategoryIcon(resource.category)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-900">
                              {resource.name}
                            </div>
                            {resource.isUrgent && (
                              <Bell className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          {resource.description && (
                            <div className="text-sm text-gray-500">
                              {resource.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {resource.category.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {resource.currentStock} {resource.unit}
                      </div>
                      <div className="text-xs text-gray-500">
                        Min: {resource.minimumThreshold}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          resource.status
                        )}`}
                      >
                        {resource.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        <div>
                          <div>{resource.location.facilityName}</div>
                          <div className="text-xs text-gray-500">
                            {resource.location.address}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedResource(resource);
                            setShowStockModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Update Stock"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          className="text-gray-600 hover:text-gray-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteResource(resource._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Add New Resource</h2>
              {facilitiesError && (
                <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md">
                  {facilitiesError}
                </div>
              )}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Resource Name
                    </label>
                    <input
                      type="text"
                      value={newResource.name}
                      onChange={(e) =>
                        setNewResource((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter resource name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={newResource.category}
                      onChange={(e) =>
                        setNewResource((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newResource.description}
                    onChange={(e) =>
                      setNewResource((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Enter description"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit
                    </label>
                    <select
                      value={newResource.unit}
                      onChange={(e) =>
                        setNewResource((prev) => ({
                          ...prev,
                          unit: e.target.value,
                        }))
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {units.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Stock
                    </label>
                    <input
                      type="number"
                      value={newResource.currentStock}
                      onChange={(e) =>
                        setNewResource((prev) => ({
                          ...prev,
                          currentStock: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Threshold
                    </label>
                    <input
                      type="number"
                      value={newResource.minimumThreshold}
                      onChange={(e) =>
                        setNewResource((prev) => ({
                          ...prev,
                          minimumThreshold: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Facility
                    </label>
                    <select
                      value={newResource.location.facilityId}
                      onChange={(e) => {
                        const selectedFacility = facilities.find(
                          (f) => f._id === e.target.value
                        );
                        setNewResource((prev) => ({
                          ...prev,
                          location: {
                            ...prev.location,
                            facilityId: e.target.value,
                            facilityName: selectedFacility?.name || "",
                            address: selectedFacility?.address || "",
                            coordinates: {
                              lat: selectedFacility?.coordinates?.lat || 0,
                              lng: selectedFacility?.coordinates?.lng || 0,
                            },
                          },
                        }));
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={facilities.length === 0}
                    >
                      <option value="">Select a facility</option>
                      {facilities.map((facility) => (
                        <option key={facility._id} value={facility._id}>
                          {facility.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={newResource.expiryDate}
                      onChange={(e) =>
                        setNewResource((prev) => ({
                          ...prev,
                          expiryDate: e.target.value,
                        }))
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={newResource.location.address}
                    onChange={(e) =>
                      setNewResource((prev) => ({
                        ...prev,
                        location: { ...prev.location, address: e.target.value },
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter facility address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      value={newResource.location.coordinates.lat}
                      onChange={(e) =>
                        setNewResource((prev) => ({
                          ...prev,
                          location: {
                            ...prev.location,
                            coordinates: {
                              ...prev.location.coordinates,
                              lat: parseFloat(e.target.value) || 0,
                            },
                          },
                        }))
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter latitude"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      value={newResource.location.coordinates.lng}
                      onChange={(e) =>
                        setNewResource((prev) => ({
                          ...prev,
                          location: {
                            ...prev.location,
                            coordinates: {
                              ...prev.location.coordinates,
                              lng: parseFloat(e.target.value) || 0,
                            },
                          },
                        }))
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter longitude"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddResource}
                  disabled={isSubmitting || facilities.length === 0}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-md ${
                    isSubmitting || facilities.length === 0
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-blue-700"
                  }`}
                >
                  {isSubmitting ? "Adding..." : "Add Resource"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showStockModal && selectedResource && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-2">Update Stock</h2>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Resource:{" "}
                  <span className="font-medium">{selectedResource.name}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Current Stock:{" "}
                  <span className="font-medium">
                    {selectedResource.currentStock} {selectedResource.unit}
                  </span>
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Operation
                  </label>
                  <select
                    value={stockOperation.operation}
                    onChange={(e) =>
                      setStockOperation((prev) => ({
                        ...prev,
                        operation: e.target.value,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="add">Add Stock</option>
                    <option value="subtract">Remove Stock</option>
                    <option value="set">Set Stock</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={stockOperation.quantity}
                    onChange={(e) =>
                      setStockOperation((prev) => ({
                        ...prev,
                        quantity: e.target.value,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    placeholder="Enter quantity"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowStockModal(false);
                    setSelectedResource(null);
                    setStockOperation({ quantity: "", operation: "add" });
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStockUpdate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
                >
                  Update Stock
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Resource;
