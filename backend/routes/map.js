import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// Shelter Schema
const shelterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  coordinates: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  capacity: { type: Number, required: true },
  currentOccupancy: { type: Number, default: 0 },
  amenities: [String],
  contactNumber: String,
  isActive: { type: Boolean, default: true },
  area: String, // Mumbai area/district
  createdAt: { type: Date, default: Date.now },
});
shelterSchema.index({ coordinates: "2dsphere" });

// Hospital Schema
const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  coordinates: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  type: {
    type: String,
    enum: ["General", "Specialty", "Emergency"],
    default: "General",
  },
  beds: { type: Number, required: true },
  availableBeds: { type: Number, required: true },
  services: [String],
  contactNumber: { type: String, required: true },
  emergencyContact: String,
  isActive: { type: Boolean, default: true },
  area: String, // Mumbai area/district
  createdAt: { type: Date, default: Date.now },
});
hospitalSchema.index({ coordinates: "2dsphere" });

const Shelter = mongoose.model("Shelter", shelterSchema);
const Hospital = mongoose.model("Hospital", hospitalSchema);

// Mumbai sample data for initialization
export const mumbaiSheltersData = [
  {
    name: "Shivaji Park Community Center",
    address: "Shivaji Park, Dadar West, Mumbai, Maharashtra 400028",
    coordinates: { type: "Point", coordinates: [72.8428, 19.027] },
    capacity: 500,
    currentOccupancy: 120,
    amenities: [
      "Food",
      "Medical Aid",
      "Clean Water",
      "Electricity",
      "Security",
    ],
    contactNumber: "+91-22-2444-5555",
    area: "Dadar",
    isActive: true,
  },
  {
    name: "Oval Maidan Emergency Shelter",
    address: "Oval Maidan, Churchgate, Mumbai, Maharashtra 400020",
    coordinates: { type: "Point", coordinates: [72.8261, 18.9298] },
    capacity: 800,
    currentOccupancy: 200,
    amenities: [
      "Food",
      "Medical Aid",
      "Clean Water",
      "Security",
      "Communication",
    ],
    contactNumber: "+91-22-2266-7777",
    area: "Churchgate",
    isActive: true,
  },
  {
    name: "Joggers Park Relief Center",
    address: "Joggers Park, Bandra West, Mumbai, Maharashtra 400050",
    coordinates: { type: "Point", coordinates: [72.8295, 19.0596] },
    capacity: 300,
    currentOccupancy: 75,
    amenities: ["Food", "Clean Water", "Rest Area", "Children Care"],
    contactNumber: "+91-22-2644-8888",
    area: "Bandra West",
    isActive: true,
  },
  {
    name: "Powai Lake Community Hall",
    address: "Powai Lake, Powai, Mumbai, Maharashtra 400076",
    coordinates: { type: "Point", coordinates: [72.9073, 19.1197] },
    capacity: 400,
    currentOccupancy: 50,
    amenities: ["Food", "Medical Aid", "Clean Water", "Electricity"],
    contactNumber: "+91-22-2857-9999",
    area: "Powai",
    isActive: true,
  },
  {
    name: "Juhu Beach Relief Camp",
    address: "Juhu Beach, Juhu, Mumbai, Maharashtra 400049",
    coordinates: { type: "Point", coordinates: [72.8268, 19.0968] },
    capacity: 600,
    currentOccupancy: 180,
    amenities: ["Food", "Medical Aid", "Clean Water", "Security"],
    contactNumber: "+91-22-2660-1111",
    area: "Juhu",
    isActive: true,
  },
  {
    name: "Worli Sea Face Community Center",
    address: "Worli Sea Face, Worli, Mumbai, Maharashtra 400018",
    coordinates: { type: "Point", coordinates: [72.8187, 19.0176] },
    capacity: 350,
    currentOccupancy: 90,
    amenities: ["Food", "Medical Aid", "Clean Water", "Electricity"],
    contactNumber: "+91-22-2493-3333",
    area: "Worli",
    isActive: true,
  },
  {
    name: "Colaba Emergency Shelter",
    address: "Colaba Causeway, Colaba, Mumbai, Maharashtra 400001",
    coordinates: { type: "Point", coordinates: [72.8147, 18.9067] },
    capacity: 250,
    currentOccupancy: 60,
    amenities: ["Food", "Clean Water", "Security", "Communication"],
    contactNumber: "+91-22-2202-4444",
    area: "Colaba",
    isActive: true,
  },
  {
    name: "Andheri Sports Complex",
    address: "DN Nagar, Andheri West, Mumbai, Maharashtra 400053",
    coordinates: { type: "Point", coordinates: [72.8392, 19.1136] },
    capacity: 700,
    currentOccupancy: 150,
    amenities: [
      "Food",
      "Medical Aid",
      "Clean Water",
      "Electricity",
      "Sports Facilities",
    ],
    contactNumber: "+91-22-2673-5555",
    area: "Andheri West",
    isActive: true,
  },
];

export const mumbaiHospitalsData = [
  {
    name: "King Edward Memorial Hospital",
    address: "Acharya Donde Marg, Parel, Mumbai, Maharashtra 400012",
    coordinates: { type: "Point", coordinates: [72.842, 19.0038] },
    type: "General",
    beds: 1200,
    availableBeds: 150,
    services: ["Emergency", "Trauma", "Cardiology", "ICU", "Nephrology"],
    contactNumber: "+91-22-2445-2222",
    emergencyContact: "+91-22-2445-1000",
    area: "Mahim",
    isActive: true,
  },
  {
    name: "Breach Candy Hospital",
    address:
      "60-A, Bhulabhai Desai Rd, Breach Candy, Mumbai, Maharashtra 400026",
    coordinates: { type: "Point", coordinates: [72.8063, 18.9697] },
    type: "General",
    beds: 200,
    availableBeds: 25,
    services: ["Emergency", "Surgery", "ICU", "Maternity"],
    contactNumber: "+91-22-2367-1888",
    emergencyContact: "+91-22-2367-1000",
    area: "Breach Candy",
    isActive: true,
  },
  {
    name: "Kokilaben Dhirubhai Ambani Hospital",
    address:
      "Rao Saheb Achutrao Patwardhan Marg, Four Bunglows, Andheri West, Mumbai, Maharashtra 400053",
    coordinates: { type: "Point", coordinates: [72.8392, 19.1136] },
    type: "Specialty",
    beds: 750,
    availableBeds: 95,
    services: [
      "Emergency",
      "Trauma",
      "Cardiology",
      "Neurology",
      "ICU",
      "Oncology",
    ],
    contactNumber: "+91-22-4269-6969",
    emergencyContact: "+91-22-4269-1000",
    area: "Andheri West",
    isActive: true,
  },
  {
    name: "Sion Hospital",
    address: "Sion-Trombay Rd, Sion, Mumbai, Maharashtra 400022",
    coordinates: { type: "Point", coordinates: [72.8654, 19.0433] },
    type: "General",
    beds: 800,
    availableBeds: 120,
    services: ["Emergency", "Trauma", "Surgery", "ICU", "Pediatrics"],
    contactNumber: "+91-22-2407-7777",
    emergencyContact: "+91-22-2407-1111",
    area: "Sion",
    isActive: true,
  },
  {
    name: "Tata Memorial Hospital",
    address: "Dr E Borges Rd, Parel, Mumbai, Maharashtra 400012",
    coordinates: { type: "Point", coordinates: [72.8431, 19.0067] },
    type: "Specialty",
    beds: 629,
    availableBeds: 75,
    services: ["Emergency", "Oncology", "Surgery", "ICU", "Radiation"],
    contactNumber: "+91-22-2417-7000",
    emergencyContact: "+91-22-2417-7100",
    area: "Parel",
    isActive: true,
  },
  {
    name: "BYL Nair Hospital",
    address: "Dr A L Nair Rd, Mumbai Central, Mumbai, Maharashtra 400008",
    coordinates: { type: "Point", coordinates: [72.8209, 18.9733] },
    type: "General",
    beds: 1400,
    availableBeds: 180,
    services: ["Emergency", "Trauma", "Surgery", "ICU", "Orthopedics"],
    contactNumber: "+91-22-2373-4141",
    emergencyContact: "+91-22-2373-4000",
    area: "Mumbai Central",
    isActive: true,
  },
  {
    name: "Jaslok Hospital",
    address: "15, Dr G Deshmukh Marg, Pedder Road, Mumbai, Maharashtra 400026",
    coordinates: { type: "Point", coordinates: [72.8118, 18.9696] },
    type: "Specialty",
    beds: 350,
    availableBeds: 40,
    services: ["Emergency", "Cardiology", "Neurology", "ICU", "Transplant"],
    contactNumber: "+91-22-6657-9999",
    emergencyContact: "+91-22-6657-9000",
    area: "Pedder Road",
    isActive: true,
  },
  {
    name: "Lilavati Hospital",
    address:
      "A-791, Bandra Reclamation, Bandra West, Mumbai, Maharashtra 400050",
    coordinates: { type: "Point", coordinates: [72.8251, 19.0521] },
    type: "Specialty",
    beds: 350,
    availableBeds: 45,
    services: ["Emergency", "Cardiology", "Neurology", "ICU", "Orthopedics"],
    contactNumber: "+91-22-2645-2000",
    emergencyContact: "+91-22-2645-1111",
    area: "Bandra West",
    isActive: true,
  },
  {
    name: "P.D. Hinduja Hospital",
    address: "Veer Savarkar Marg, Mahim West, Mumbai, Maharashtra 400016",
    coordinates: { type: "Point", coordinates: [72.8397, 19.033] },
    type: "Specialty",
    beds: 450,
    availableBeds: 60,
    services: [
      "Emergency",
      "Trauma",
      "Cardiology",
      "Neurology",
      "ICU",
      "Pulmonology",
    ],
    contactNumber: "+91-22-2445-1515",
    emergencyContact: "+91-22-2445-1000",
    area: "Mahim",
    isActive: true,
  },
];

// Initialize database with Mumbai data
router.post("/init-mumbai-data", async (req, res) => {
  try {
    // Clear existing data
    await Shelter.deleteMany({});
    await Hospital.deleteMany({});

    // Insert Mumbai shelters
    const shelters = await Shelter.insertMany(mumbaiSheltersData);

    // Insert Mumbai hospitals
    const hospitals = await Hospital.insertMany(mumbaiHospitalsData);

    res.json({
      success: true,
      message: "Mumbai data initialized successfully",
      data: {
        shelters: shelters.length,
        hospitals: hospitals.length,
      },
    });
  } catch (error) {
    console.error("Error initializing Mumbai data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initialize Mumbai data",
      error: error.message,
    });
  }
});

// GET /api/locations/shelters - Get all shelters or nearest shelters
router.get("/shelters", async (req, res) => {
  try {
    const { lat, lng, radius = 10000, limit = 10, area } = req.query;

    let query = { isActive: true };
    if (area) {
      query.area = new RegExp(area, "i");
    }

    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      if (isNaN(userLat) || isNaN(userLng)) {
        return res.status(400).json({
          success: false,
          message: "Invalid latitude or longitude",
        });
      }

      const shelters = await Shelter.find({
        ...query,
        coordinates: {
          $near: {
            $geometry: { type: "Point", coordinates: [userLng, userLat] },
            $maxDistance: parseFloat(radius),
          },
        },
      }).limit(parseInt(limit));

      res.json({
        success: true,
        data: shelters,
        count: shelters.length,
        totalCapacity: shelters.reduce(
          (acc, shelter) => acc + shelter.capacity,
          0
        ),
        availableCapacity: shelters.reduce(
          (acc, shelter) => acc + (shelter.capacity - shelter.currentOccupancy),
          0
        ),
      });
    } else {
      const shelters = await Shelter.find(query).limit(parseInt(limit));

      res.json({
        success: true,
        data: shelters,
        count: shelters.length,
        totalCapacity: shelters.reduce(
          (acc, shelter) => acc + shelter.capacity,
          0
        ),
        availableCapacity: shelters.reduce(
          (acc, shelter) => acc + (shelter.capacity - shelter.currentOccupancy),
          0
        ),
      });
    }
  } catch (error) {
    console.error("Error fetching shelters:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch shelters",
      error: error.message,
    });
  }
});

// GET /api/locations/hospitals - Get all hospitals or nearest hospitals
router.get("/hospitals", async (req, res) => {
  try {
    const { lat, lng, radius = 10000, limit = 10, type, area } = req.query;

    let query = { isActive: true };
    if (type) {
      query.type = type;
    }
    if (area) {
      query.area = new RegExp(area, "i");
    }

    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      if (isNaN(userLat) || isNaN(userLng)) {
        return res.status(400).json({
          success: false,
          message: "Invalid latitude or longitude",
        });
      }

      const hospitals = await Hospital.find({
        ...query,
        coordinates: {
          $near: {
            $geometry: { type: "Point", coordinates: [userLng, userLat] },
            $maxDistance: parseFloat(radius),
          },
        },
      }).limit(parseInt(limit));

      res.json({
        success: true,
        data: hospitals,
        count: hospitals.length,
        totalBeds: hospitals.reduce((acc, hospital) => acc + hospital.beds, 0),
        availableBeds: hospitals.reduce(
          (acc, hospital) => acc + hospital.availableBeds,
          0
        ),
      });
    } else {
      const hospitals = await Hospital.find(query).limit(parseInt(limit));

      res.json({
        success: true,
        data: hospitals,
        count: hospitals.length,
        totalBeds: hospitals.reduce((acc, hospital) => acc + hospital.beds, 0),
        availableBeds: hospitals.reduce(
          (acc, hospital) => acc + hospital.availableBeds,
          0
        ),
      });
    }
  } catch (error) {
    console.error("Error fetching hospitals:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch hospitals",
      error: error.message,
    });
  }
});

// GET /api/locations/nearest - Get nearest facilities of both types
router.get("/nearest", async (req, res) => {
  try {
    const { lat, lng, limit = 5 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude or longitude",
      });
    }

    const shelters = await Shelter.find({
      isActive: true,
      coordinates: {
        $near: {
          $geometry: { type: "Point", coordinates: [userLng, userLat] },
          $maxDistance: 10000, // 10km
        },
      },
    }).limit(parseInt(limit));

    const hospitals = await Hospital.find({
      isActive: true,
      coordinates: {
        $near: {
          $geometry: { type: "Point", coordinates: [userLng, userLat] },
          $maxDistance: 10000, // 10km
        },
      },
    }).limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        shelters: shelters.map((s) => ({ ...s.toObject(), type: "shelter" })),
        hospitals: hospitals.map((h) => ({
          ...h.toObject(),
          type: "hospital",
        })),
      },
      userLocation: { lat: userLat, lng: userLng },
    });
  } catch (error) {
    console.error("Error fetching nearest facilities:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch nearest facilities",
      error: error.message,
    });
  }
});

// GET /api/locations/areas - Get list of Mumbai areas
router.get("/areas", async (req, res) => {
  try {
    const shelterAreas = await Shelter.distinct("area", { isActive: true });
    const hospitalAreas = await Hospital.distinct("area", { isActive: true });

    const allAreas = [...new Set([...shelterAreas, ...hospitalAreas])].sort();

    res.json({
      success: true,
      data: allAreas,
      count: allAreas.length,
    });
  } catch (error) {
    console.error("Error fetching areas:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch areas",
      error: error.message,
    });
  }
});

// POST /api/locations/shelters - Add new shelter (admin only)
router.post("/shelters", async (req, res) => {
  try {
    const shelter = new Shelter(req.body);
    const savedShelter = await shelter.save();

    res.status(201).json({
      success: true,
      data: savedShelter,
      message: "Shelter added successfully",
    });
  } catch (error) {
    console.error("Error adding shelter:", error);
    res.status(400).json({
      success: false,
      message: "Failed to add shelter",
      error: error.message,
    });
  }
});

// POST /api/locations/hospitals - Add new hospital (admin only)
router.post("/hospitals", async (req, res) => {
  try {
    const hospital = new Hospital(req.body);
    const savedHospital = await hospital.save();

    res.status(201).json({
      success: true,
      data: savedHospital,
      message: "Hospital added successfully",
    });
  } catch (error) {
    console.error("Error adding hospital:", error);
    res.status(400).json({
      success: false,
      message: "Failed to add hospital",
      error: error.message,
    });
  }
});

// PUT /api/locations/shelters/:id - Update shelter
router.put("/shelters/:id", async (req, res) => {
  try {
    const updatedShelter = await Shelter.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedShelter) {
      return res.status(404).json({
        success: false,
        message: "Shelter not found",
      });
    }

    res.json({
      success: true,
      data: updatedShelter,
      message: "Shelter updated successfully",
    });
  } catch (error) {
    console.error("Error updating shelter:", error);
    res.status(400).json({
      success: false,
      message: "Failed to update shelter",
      error: error.message,
    });
  }
});

// PUT /api/locations/hospitals/:id - Update hospital
router.put("/hospitals/:id", async (req, res) => {
  try {
    const updatedHospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedHospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    res.json({
      success: true,
      data: updatedHospital,
      message: "Hospital updated successfully",
    });
  } catch (error) {
    console.error("Error updating hospital:", error);
    res.status(400).json({
      success: false,
      message: "Failed to update hospital",
      error: error.message,
    });
  }
});

export default router;
