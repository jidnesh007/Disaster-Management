// services/alertScheduler.js
import cron from "node-cron";
import reliefWebService from "./reliefWebService.js";

class AlertScheduler {
  constructor() {
    this.wss = null;
    this.lastAlertIds = new Set();
    this.isRunning = false;
  }

  /**
   * Initialize the scheduler with WebSocket server
   */
  init(wss) {
    this.wss = wss;
    this.startScheduler();
    console.log("Alert scheduler initialized");
  }

  /**
   * Start the cron job for fetching alerts
   */
  startScheduler() {
    if (this.isRunning) {
      console.log("Alert scheduler is already running");
      return;
    }

    // Run every 15 minutes
    cron.schedule("*/15 * * * *", async () => {
      console.log("🔔 Checking for new disaster alerts...");
      await this.checkForNewAlerts();
    });

    // Run every hour for comprehensive check
    cron.schedule("0 * * * *", async () => {
      console.log("🔔 Running hourly comprehensive alert check...");
      await this.comprehensiveAlertCheck();
    });

    this.isRunning = true;
    console.log("📅 Alert scheduler started - checking every 15 minutes");

    // Run initial check
    setTimeout(() => this.checkForNewAlerts(), 5000);
  }

  /**
   * Check for new alerts and broadcast them
   */
  async checkForNewAlerts() {
    try {
      const alerts = await reliefWebService.getIndiaAlerts({ limit: 20 });
      const newAlerts = alerts.filter(
        (alert) => !this.lastAlertIds.has(alert.id)
      );

      if (newAlerts.length > 0) {
        console.log(`📢 Found ${newAlerts.length} new alerts`);

        // Update our tracking set
        newAlerts.forEach((alert) => this.lastAlertIds.add(alert.id));

        // Clean up old IDs (keep only last 1000)
        if (this.lastAlertIds.size > 1000) {
          const idsArray = Array.from(this.lastAlertIds);
          this.lastAlertIds = new Set(idsArray.slice(-1000));
        }

        // Broadcast new alerts
        await this.broadcastAlerts(newAlerts);
      } else {
        console.log("✅ No new alerts found");
      }
    } catch (error) {
      console.error("❌ Error checking for new alerts:", error);
    }
  }

  /**
   * Comprehensive check including reports and statistics
   */
  async comprehensiveAlertCheck() {
    try {
      const [alerts, reports, stats] = await Promise.all([
        reliefWebService.getIndiaAlerts({ limit: 50 }),
        reliefWebService.getIndiaReports(20),
        reliefWebService.getDisasterStats(),
      ]);

      // Broadcast comprehensive update
      const updateMessage = {
        type: "COMPREHENSIVE_UPDATE",
        data: {
          alerts: alerts.slice(0, 10), // Latest 10 alerts
          recentReports: reports.slice(0, 5), // Latest 5 reports
          stats: {
            totalActive: stats.totalDisasters,
            highSeverity: stats.bySeverity.HIGH,
            mediumSeverity: stats.bySeverity.MEDIUM,
            lowSeverity: stats.bySeverity.LOW,
          },
        },
        timestamp: new Date().toISOString(),
      };

      this.broadcastToAll(updateMessage);
      console.log("📊 Sent comprehensive disaster update to all clients");
    } catch (error) {
      console.error("❌ Error in comprehensive alert check:", error);
    }
  }

  /**
   * Broadcast new alerts to connected clients
   */
  async broadcastAlerts(alerts) {
    if (!this.wss || !alerts.length) return;

    for (const alert of alerts) {
      const alertMessage = {
        type: "NEW_DISASTER_ALERT",
        alert: {
          id: alert.id,
          title: alert.title,
          description: alert.description,
          type: alert.type,
          severity: alert.severity,
          location: alert.location,
          date: alert.date,
          url: alert.url,
          isNew: true,
        },
        timestamp: new Date().toISOString(),
      };

      // Send to all connected clients
      this.broadcastToAll(alertMessage);

      // Special handling for high severity alerts
      if (alert.severity === "HIGH") {
        const urgentAlert = {
          type: "URGENT_ALERT",
          alert: alertMessage.alert,
          message: `🚨 URGENT: ${alert.type} alert for ${alert.location.join(
            ", "
          )}`,
          timestamp: new Date().toISOString(),
        };

        // Broadcast urgent alert with priority
        setTimeout(() => this.broadcastToAll(urgentAlert), 1000);
      }
    }

    console.log(
      `📡 Broadcasted ${alerts.length} new alerts to ${this.wss.clients.size} connected clients`
    );
  }

  /**
   * Broadcast message to all connected WebSocket clients
   */
  broadcastToAll(message) {
    if (!this.wss) return;

    const messageStr = JSON.stringify(message);
    let successCount = 0;
    let failCount = 0;

    this.wss.clients.forEach((client) => {
      try {
        if (client.readyState === client.OPEN) {
          client.send(messageStr);
          successCount++;
        }
      } catch (error) {
        console.error("Error sending message to client:", error);
        failCount++;
      }
    });

    if (process.env.NODE_ENV === "development") {
      console.log(
        `📤 Message sent to ${successCount} clients, ${failCount} failed`
      );
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      trackedAlerts: this.lastAlertIds.size,
      connectedClients: this.wss ? this.wss.clients.size : 0,
      lastCheck: new Date().toISOString(),
    };
  }

  /**
   * Stop the scheduler
   */
  stop() {
    this.isRunning = false;
    console.log("🛑 Alert scheduler stopped");
  }

  /**
   * Force check for alerts (manual trigger)
   */
  async forceCheck() {
    console.log("🔄 Manual alert check triggered");
    await this.checkForNewAlerts();
  }

  /**
   * Clear tracked alert IDs (reset)
   */
  reset() {
    this.lastAlertIds.clear();
    console.log("🔄 Alert tracker reset");
  }
}

export default new AlertScheduler();
