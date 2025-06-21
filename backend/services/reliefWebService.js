// services/reliefWebService.js
import axios from "axios";

class ReliefWebService {
  constructor() {
    this.baseURL = "https://api.reliefweb.int/v1";
    this.indiaCountryId = 119; // ReliefWeb country ID for India
  }

  /**
   * Fetch disasters/alerts from ReliefWeb for India
   */
  async getIndiaAlerts(params = {}) {
    try {
      const defaultParams = {
        appname: "mumbai-disaster-mgmt",
        profile: "list",
        preset: "latest",
        slim: 1,
        limit: 50,
        sort: ["date:desc"],
        filter: {
          field: "country",
          value: this.indiaCountryId,
        },
      };

      const queryParams = { ...defaultParams, ...params };

      const response = await axios.get(`${this.baseURL}/disasters`, {
        params: {
          appname: queryParams.appname,
          profile: queryParams.profile,
          preset: queryParams.preset,
          slim: queryParams.slim,
          limit: queryParams.limit,
          "sort[]": queryParams.sort,
          "filter[field]": queryParams.filter.field,
          "filter[value]": queryParams.filter.value,
        },
      });

      return this.formatAlerts(response.data.data);
    } catch (error) {
      console.error("Error fetching ReliefWeb alerts:", error);
      throw new Error("Failed to fetch disaster alerts");
    }
  }

  /**
   * Get specific types of disasters (flood, cyclone, earthquake, etc.)
   */
  async getAlertsByType(disasterType, limit = 20) {
    try {
      const response = await axios.get(`${this.baseURL}/disasters`, {
        params: {
          appname: "mumbai-disaster-mgmt",
          profile: "list",
          slim: 1,
          limit,
          "sort[]": "date:desc",
          "filter[conditions][0][field]": "country",
          "filter[conditions][0][value]": this.indiaCountryId,
          "filter[conditions][1][field]": "type",
          "filter[conditions][1][value]": disasterType,
          "filter[operator]": "AND",
        },
      });

      return this.formatAlerts(response.data.data);
    } catch (error) {
      console.error(`Error fetching ${disasterType} alerts:`, error);
      throw new Error(`Failed to fetch ${disasterType} alerts`);
    }
  }

  /**
   * Get recent reports/updates for India
   */
  async getIndiaReports(limit = 30) {
    try {
      const response = await axios.get(`${this.baseURL}/reports`, {
        params: {
          appname: "mumbai-disaster-mgmt",
          profile: "list",
          preset: "latest",
          slim: 1,
          limit,
          "sort[]": "date:desc",
          "filter[field]": "country",
          "filter[value]": this.indiaCountryId,
        },
      });

      return this.formatReports(response.data.data);
    } catch (error) {
      console.error("Error fetching India reports:", error);
      throw new Error("Failed to fetch disaster reports");
    }
  }

  /**
   * Search for specific disasters by keywords
   */
  async searchDisasters(query, limit = 20) {
    try {
      const response = await axios.get(`${this.baseURL}/disasters`, {
        params: {
          appname: "mumbai-disaster-mgmt",
          profile: "list",
          slim: 1,
          limit,
          "sort[]": "date:desc",
          "filter[conditions][0][field]": "country",
          "filter[conditions][0][value]": this.indiaCountryId,
          "filter[conditions][1][field]": "name",
          "filter[conditions][1][value]": query,
          "filter[operator]": "AND",
        },
      });

      return this.formatAlerts(response.data.data);
    } catch (error) {
      console.error("Error searching disasters:", error);
      throw new Error("Failed to search disasters");
    }
  }

  /**
   * Format disaster alerts for consistent structure
   */
  formatAlerts(data) {
    if (!data || !Array.isArray(data)) return [];

    return data.map((alert) => ({
      id: alert.id,
      title: alert.fields?.name || "Unknown Disaster",
      description: alert.fields?.description || "",
      type: alert.fields?.type?.[0]?.name || "Unknown",
      status: alert.fields?.status || "Unknown",
      date: alert.fields?.date?.created || alert.fields?.date?.changed,
      country: alert.fields?.country?.[0]?.name || "India",
      location: this.extractLocation(alert.fields),
      severity: this.determineSeverity(alert.fields),
      url: alert.fields?.url || `https://reliefweb.int/disaster/${alert.id}`,
      source: "ReliefWeb",
      glide: alert.fields?.glide || null,
      primaryCountry: alert.fields?.primary_country?.[0]?.name || "India",
    }));
  }

  /**
   * Format reports for consistent structure
   */
  formatReports(data) {
    if (!data || !Array.isArray(data)) return [];

    return data.map((report) => ({
      id: report.id,
      title: report.fields?.title || "Disaster Report",
      summary: report.fields?.body?.summary || "",
      date: report.fields?.date?.created || report.fields?.date?.changed,
      source: report.fields?.source?.[0]?.name || "Unknown Source",
      country: report.fields?.country?.[0]?.name || "India",
      url: report.fields?.url || `https://reliefweb.int/report/${report.id}`,
      theme: report.fields?.theme?.map((t) => t.name) || [],
      disaster: report.fields?.disaster?.map((d) => d.name) || [],
      format: report.fields?.format?.[0]?.name || "Report",
    }));
  }

  /**
   * Extract location information from alert fields
   */
  extractLocation(fields) {
    const locations = [];

    if (fields.country) {
      locations.push(...fields.country.map((c) => c.name));
    }

    if (fields.primary_country) {
      locations.push(...fields.primary_country.map((c) => c.name));
    }

    return locations;
  }

  /**
   * Determine severity based on disaster type and status
   */
  determineSeverity(fields) {
    const type = fields.type?.[0]?.name?.toLowerCase() || "";
    const status = fields.status?.toLowerCase() || "";

    // High severity disasters
    const highSeverityTypes = [
      "earthquake",
      "tsunami",
      "cyclone",
      "flash flood",
    ];
    const urgentStatuses = ["ongoing", "alert", "emergency"];

    if (
      highSeverityTypes.some((t) => type.includes(t)) ||
      urgentStatuses.includes(status)
    ) {
      return "HIGH";
    }

    // Medium severity
    const mediumSeverityTypes = ["flood", "landslide", "storm"];
    if (mediumSeverityTypes.some((t) => type.includes(t))) {
      return "MEDIUM";
    }

    return "LOW";
  }

  /**
   * Get disaster statistics for India
   */
  async getDisasterStats() {
    try {
      const [disasters, reports] = await Promise.all([
        this.getIndiaAlerts({ limit: 100 }),
        this.getIndiaReports({ limit: 100 }),
      ]);

      const stats = {
        totalDisasters: disasters.length,
        totalReports: reports.length,
        byType: {},
        bySeverity: { HIGH: 0, MEDIUM: 0, LOW: 0 },
        recent: disasters.slice(0, 5),
      };

      disasters.forEach((disaster) => {
        // Count by type
        const type = disaster.type;
        stats.byType[type] = (stats.byType[type] || 0) + 1;

        // Count by severity
        stats.bySeverity[disaster.severity]++;
      });

      return stats;
    } catch (error) {
      console.error("Error getting disaster stats:", error);
      throw new Error("Failed to get disaster statistics");
    }
  }
}

export default new ReliefWebService();
