
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import { Hospital, Navigation, Phone, Bed } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Custom icons for Leaflet markers
const userIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const hospitalIcon = L.divIcon({
  html: `
    <div class="relative">
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C9.24 2 7 4.24 7 7C7 9.76 9.24 12 12 12C14.76 12 17 9.76 17 7C17 4.24 14.76 2 12 2ZM12 3C14.21 3 16 4.79 16 7C16 9.21 14.21 11 12 11C9.79 11 8 9.21 8 7C8 4.79 9.79 3 12 3ZM11 14H13V16H15V18H13V20H11V18H9V16H11V14ZM4 22V21C4 18.24 9.04 17 12 17C14.96 17 20 18.24 20 21V22H4Z" fill="#DC2626"/>
      </svg>
      <div class="absolute inset-0 animate-pulse bg-red-500 opacity-30 rounded-full"></div>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
  className: "custom-hospital-icon",
});

const MumbaiDisasterMap = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 19.076, lng: 72.8777 }); // Mumbai center
  const [zoom, setZoom] = useState(11);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          setMapCenter(location);
          setZoom(13);
          fetchNearbyHospitals(location);
        },
        (error) => {
          console.log("Location access denied or unavailable:", error);
          fetchNearbyHospitals(mapCenter);
        }
      );
    } else {
      console.log("Geolocation not supported");
      fetchNearbyHospitals(mapCenter);
    }
  }, []);

  const fetchNearbyHospitals = async (location) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/locations/nearest`,
        {
          params: {
            lat: location.lat,
            lng: location.lng,
            limit: 5,
          },
        }
      );
      setHospitals(response.data.data.hospitals || []);
      setError(null);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching hospitals:", error.message);
      setError("Failed to load hospital data. Please try again later.");
      setHospitals([]);
      setLoading(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getDistance = (location) => {
    if (!userLocation || !location.coordinates) return null;
    return calculateDistance(
      userLocation.lat,
      userLocation.lng,
      location.coordinates.coordinates[1],
      location.coordinates.coordinates[0]
    ).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading hospital map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white p-4">
        <h2 className="text-2xl font-bold mb-2">Nearby Hospitals</h2>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Hospital className="w-4 h-4" />
            <span>{hospitals.length} Hospitals</span>
          </div>
          {userLocation && (
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              <span>Your Location Detected</span>
            </div>
          )}
        </div>
        {error && (
          <div className="mt-2 text-sm text-yellow-200">
            <p>{error}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 relative">
          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={zoom}
            style={{ height: "600px", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {userLocation && (
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={userIcon}
              >
                <Popup>Your Location</Popup>
              </Marker>
            )}
            {hospitals.map((hospital) => (
              <Marker
                key={`hospital-${hospital._id}`}
                position={[
                  hospital.coordinates.coordinates[1],
                  hospital.coordinates.coordinates[0],
                ]}
                icon={hospitalIcon}
                eventHandlers={{
                  click: () =>
                    setSelectedMarker({
                      ...hospital,
                      type: "hospital",
                      id: hospital._id,
                    }),
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>{hospital.name}</strong> (Hospital)<br />
                    Beds: {hospital.availableBeds}/{hospital.beds}<br />
                    Contact: {hospital.contactNumber}<br />
                    Distance: {getDistance(hospital)} km
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 text-sm z-[1000]">
            <h3 className="font-semibold mb-2">Legend</h3>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span>Hospitals</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span>Your Location</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-80 bg-gray-50 p-4 border-l">
          {selectedMarker ? (
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-full bg-red-500">
                  <Hospital className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{selectedMarker.name}</h3>
                  <p className="text-gray-600 text-sm">
                    {selectedMarker.address}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>{selectedMarker.contactNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Bed className="w-4 h-4 text-gray-500" />
                  <span>
                    {selectedMarker.availableBeds}/{selectedMarker.beds} beds
                    available
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{
                      width: `${
                        ((selectedMarker.beds - selectedMarker.availableBeds) /
                          selectedMarker.beds) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Services:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedMarker.services?.map((service, index) => (
                      <span
                        key={index}
                        className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
                {selectedMarker.emergencyContact && (
                  <div className="mt-3 p-2 bg-red-50 rounded">
                    <p className="text-sm font-medium text-red-800">
                      Emergency Contact:
                    </p>
                    <p className="text-sm text-red-700">
                      {selectedMarker.emergencyContact}
                    </p>
                  </div>
                )}
                {getDistance(selectedMarker) && (
                  <div className="mt-3 p-2 bg-green-50 rounded">
                    <p className="text-sm font-medium text-green-800">
                      Distance: {getDistance(selectedMarker)} km from your
                      location
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Hospital className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Click on a hospital marker to view details</p>
              <p className="text-sm text-gray-500 mt-2">
                Red markers are hospitals
              </p>
            </div>
          )}

          <div className="mt-6">
            <div className="bg-red-50 p-3 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">Hospital Beds</h4>
              <p className="text-sm text-red-700">
                {hospitals.reduce(
                  (acc, hospital) => acc + hospital.availableBeds,
                  0
                )}{" "}
                beds available
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MumbaiDisasterMap;
