import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Shield,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Plus,
  Trash2,
} from "lucide-react";

const SOSSystem = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [sosLoading, setSosLoading] = useState(false);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [activeTab, setActiveTab] = useState("sos");
  const [sosMessage, setSosMessage] = useState("");
  const [checkInMessage, setCheckInMessage] = useState("");
  const [checkInStatus, setCheckInStatus] = useState("SAFE");
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    email: "",
    relationship: "",
  });
  const [showAddContact, setShowAddContact] = useState(false);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });

          // Reverse geocoding to get address
          fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${position.coords.latitude}+${position.coords.longitude}&key=YOUR_API_KEY`
          )
            .then((res) => res.json())
            .then((data) => {
              if (data.results && data.results[0]) {
                setCurrentLocation((prev) => ({
                  ...prev,
                  address: data.results[0].formatted,
                }));
              }
            })
            .catch((err) => console.log("Geocoding error:", err));
        },
        (error) => {
          setLocationError(error.message);
        }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser");
    }
  }, []);

  // Fetch data
  useEffect(() => {
    fetchAlerts();
    fetchCheckIns();
    fetchEmergencyContacts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/sos/alerts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setAlerts(data.alerts);
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    }
  };

  const fetchCheckIns = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/sos/checkins", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCheckIns(data.checkIns);
      }
    } catch (error) {
      console.error("Failed to fetch check-ins:", error);
    }
  };

  const fetchEmergencyContacts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/sos/emergency-contacts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setEmergencyContacts(data.contacts);
      }
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    }
  };

  const sendSOSAlert = async () => {
    if (!currentLocation) {
      alert("Location is required to send SOS alert");
      return;
    }

    setSosLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/sos/alert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          location: currentLocation,
          message: sosMessage,
          urgencyLevel: "HIGH",
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(
          `SOS Alert sent successfully! ${data.contactsNotified} emergency contacts notified.`
        );
        setSosMessage("");
        fetchAlerts();
      } else {
        alert(`Failed to send SOS: ${data.message}`);
      }
    } catch (error) {
      alert("Failed to send SOS alert");
      console.error(error);
    } finally {
      setSosLoading(false);
    }
  };

  const sendCheckIn = async () => {
    setCheckInLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/sos/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: checkInStatus,
          location: currentLocation,
          message: checkInMessage,
          notifyContacts: true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Check-in recorded! ${data.contactsNotified} contacts notified.`);
        setCheckInMessage("");
        fetchCheckIns();
      } else {
        alert(`Failed to check in: ${data.message}`);
      }
    } catch (error) {
      alert("Failed to send check-in");
      console.error(error);
    } finally {
      setCheckInLoading(false);
    }
  };

  const addEmergencyContact = async () => {
    if (!newContact.name || !newContact.phone) {
      alert("Name and phone are required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/sos/emergency-contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newContact),
      });

      const data = await response.json();
      if (data.success) {
        setNewContact({ name: "", phone: "", email: "", relationship: "" });
        setShowAddContact(false);
        fetchEmergencyContacts();
      } else {
        alert(`Failed to add contact: ${data.message}`);
      }
    } catch (error) {
      alert("Failed to add emergency contact");
      console.error(error);
    }
  };

  const deleteEmergencyContact = async (contactId) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/sos/emergency-contacts/${contactId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        fetchEmergencyContacts();
      } else {
        alert(`Failed to delete contact: ${data.message}`);
      }
    } catch (error) {
      alert("Failed to delete emergency contact");
      console.error(error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      SAFE: "text-green-600 bg-green-100",
      NEEDS_HELP: "text-yellow-600 bg-yellow-100",
      INJURED: "text-red-600 bg-red-100",
      MISSING: "text-purple-600 bg-purple-100",
      ACTIVE: "text-red-600 bg-red-100",
      ACKNOWLEDGED: "text-yellow-600 bg-yellow-100",
      IN_PROGRESS: "text-blue-600 bg-blue-100",
      RESOLVED: "text-green-600 bg-green-100",
    };
    return colors[status] || "text-gray-600 bg-gray-100";
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Emergency System
        </h1>
        <p className="text-gray-600">
          Send SOS alerts and check in with your emergency contacts
        </p>

        {locationError && (
          <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-700">Location Error: {locationError}</p>
          </div>
        )}

        {currentLocation && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm text-blue-700">
                Current Location:{" "}
                {currentLocation.address ||
                  `${currentLocation.latitude.toFixed(
                    4
                  )}, ${currentLocation.longitude.toFixed(4)}`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6">
        {[
          { id: "sos", label: "SOS Alert", icon: AlertTriangle },
          { id: "checkin", label: "Check In", icon: Shield },
          { id: "contacts", label: "Emergency Contacts", icon: Users },
          { id: "history", label: "History", icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.id
                  ? "bg-red-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SOS Alert Tab */}
      {activeTab === "sos" && (
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-4 flex items-center">
              <AlertTriangle className="h-6 w-6 mr-2" />
              Emergency SOS Alert
            </h2>

            <div className="space-y-4">
              <textarea
                value={sosMessage}
                onChange={(e) => setSosMessage(e.target.value)}
                placeholder="Describe your emergency (optional)"
                className="w-full p-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows="3"
              />

              <button
                onClick={sendSOSAlert}
                disabled={sosLoading || !currentLocation}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-4 px-6 rounded-lg text-lg transition-colors flex items-center justify-center"
              >
                {sosLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                ) : (
                  <AlertTriangle className="h-6 w-6 mr-2" />
                )}
                {sosLoading ? "Sending SOS..." : "SEND SOS ALERT"}
              </button>
            </div>

            <div className="mt-4 text-sm text-red-700">
              <p>• Your current location will be sent to rescue teams</p>
              <p>• All emergency contacts will be notified immediately</p>
              <p>• Use only in genuine emergencies</p>
            </div>
          </div>
        </div>
      )}

      {/* Check In Tab */}
      {activeTab === "checkin" && (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-green-800 mb-4 flex items-center">
              <Shield className="h-6 w-6 mr-2" />
              Safety Check-In
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={checkInStatus}
                  onChange={(e) => setCheckInStatus(e.target.value)}
                  className="w-full p-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="SAFE">I'm Safe</option>
                  <option value="NEEDS_HELP">I Need Help</option>
                  <option value="INJURED">I'm Injured</option>
                </select>
              </div>

              <textarea
                value={checkInMessage}
                onChange={(e) => setCheckInMessage(e.target.value)}
                placeholder="Additional message (optional)"
                className="w-full p-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                rows="3"
              />

              <button
                onClick={sendCheckIn}
                disabled={checkInLoading}
                className={`w-full font-bold py-3 px-6 rounded-lg text-lg transition-colors flex items-center justify-center ${
                  checkInStatus === "SAFE"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : checkInStatus === "NEEDS_HELP"
                    ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                {checkInLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                ) : (
                  <CheckCircle className="h-6 w-6 mr-2" />
                )}
                {checkInLoading ? "Sending..." : "Send Check-In"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Contacts Tab */}
      {activeTab === "contacts" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Emergency Contacts
            </h2>
            <button
              onClick={() => setShowAddContact(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </button>
          </div>

          {showAddContact && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Add Emergency Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) =>
                    setNewContact({ ...newContact, name: e.target.value })
                  }
                  placeholder="Full Name *"
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="tel"
                  value={newContact.phone}
                  onChange={(e) =>
                    setNewContact({ ...newContact, phone: e.target.value })
                  }
                  placeholder="Phone Number *"
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) =>
                    setNewContact({ ...newContact, email: e.target.value })
                  }
                  placeholder="Email Address"
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  value={newContact.relationship}
                  onChange={(e) =>
                    setNewContact({
                      ...newContact,
                      relationship: e.target.value,
                    })
                  }
                  placeholder="Relationship (e.g., Spouse, Parent)"
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={addEmergencyContact}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                  Add Contact
                </button>
                <button
                  onClick={() => setShowAddContact(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {emergencyContacts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No emergency contacts added yet</p>
                <p className="text-sm">
                  Add contacts to receive notifications when you send SOS alerts
                  or check-ins
                </p>
              </div>
            ) : (
              emergencyContacts.map((contact) => (
                <div
                  key={contact._id}
                  className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {contact.name}
                    </h4>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <Phone className="h-4 w-4 mr-1" />
                      {contact.phone}
                      {contact.email && (
                        <>
                          <span className="mx-2">•</span>
                          {contact.email}
                        </>
                      )}
                    </div>
                    {contact.relationship && (
                      <p className="text-sm text-gray-500 mt-1">
                        {contact.relationship}
                      </p>
                    )}
                    {contact.isPrimary && (
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1">
                        Primary Contact
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteEmergencyContact(contact._id)}
                    className="text-red-600 hover:text-red-800 p-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Recent Activity
          </h2>

          {/* SOS Alerts History */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              SOS Alerts
            </h3>
            {alerts.length === 0 ? (
              <p className="text-gray-500 text-sm bg-gray-50 p-4 rounded-lg">
                No SOS alerts sent
              </p>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert._id}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              alert.status
                            )}`}
                          >
                            {alert.status}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            {new Date(alert.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {alert.message && (
                          <p className="text-gray-700 mb-2">{alert.message}</p>
                        )}
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-1" />
                          {alert.location.address ||
                            `${alert.location.latitude}, ${alert.location.longitude}`}
                        </div>
                        {alert.rescueTeamAssigned && (
                          <p className="text-sm text-blue-600 mt-2">
                            Rescue team assigned:{" "}
                            {alert.rescueTeamAssigned.name}
                          </p>
                        )}
                      </div>
                      <div className="ml-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            alert.urgencyLevel === "CRITICAL"
                              ? "bg-red-200 text-red-800"
                              : alert.urgencyLevel === "HIGH"
                              ? "bg-orange-200 text-orange-800"
                              : alert.urgencyLevel === "MEDIUM"
                              ? "bg-yellow-200 text-yellow-800"
                              : "bg-gray-200 text-gray-800"
                          }`}
                        >
                          {alert.urgencyLevel}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Check-ins History */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-green-600" />
              Check-ins
            </h3>
            {checkIns.length === 0 ? (
              <p className="text-gray-500 text-sm bg-gray-50 p-4 rounded-lg">
                No check-ins recorded
              </p>
            ) : (
              <div className="space-y-3">
                {checkIns.map((checkIn) => (
                  <div
                    key={checkIn._id}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              checkIn.status
                            )}`}
                          >
                            {checkIn.status.replace("_", " ")}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            {new Date(checkIn.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {checkIn.message && (
                          <p className="text-gray-700 mb-2">
                            {checkIn.message}
                          </p>
                        )}
                        {checkIn.location && (
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            {checkIn.location.address ||
                              `${checkIn.location.latitude}, ${checkIn.location.longitude}`}
                          </div>
                        )}
                        <p className="text-sm text-gray-500">
                          {checkIn.notifiedContacts.length} contacts notified
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SOSSystem;
