import nodemailer from "nodemailer";
import twilio from "twilio";

// Email configuration
const emailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// SMS configuration (Twilio)
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Simple phone number cleaner (removes spaces, dashes, and adds + if missing)
const cleanPhoneNumber = (phone) => {
  if (!phone) return null;
  let cleaned = phone.replace(/[\s()-]/g, "").trim();
  if (!cleaned.startsWith("+")) {
    // Assume US country code if no +; adjust based on your use case
    cleaned = `+1${cleaned}`;
  }
  // Basic validation: E.164 format (e.g., +1234567890)
  if (!/^\+\d{10,15}$/.test(cleaned)) {
    console.warn(`Invalid phone number format: ${phone} -> ${cleaned}`);
    return null;
  }
  return cleaned;
};

export const sendSMS = async (to, message) => {
  try {
    const cleanedTo = cleanPhoneNumber(to);
    if (!cleanedTo) {
      throw new Error(`Invalid phone number: ${to}`);
    }

    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: cleanedTo,
    });

    console.log(`SMS sent successfully to ${cleanedTo}: SID ${result.sid}`);
    if (process.env.NODE_ENV === "development") {
      console.debug("Twilio response:", result);
    }

    return { success: true, sid: result.sid };
  } catch (error) {
    console.error(`SMS sending failed to ${to}:`, {
      message: error.message,
      code: error.code || "N/A",
      moreInfo: error.moreInfo || "N/A",
    });
    return { success: false, error: error.message, code: error.code };
  }
};

export const sendEmail = async (to, subject, text, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    };

    const result = await emailTransporter.sendMail(mailOptions);
    console.log("Email sent successfully:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Email sending failed:", error);
    return { success: false, error: error.message };
  }
};

export const sendSOSNotification = async (
  contact,
  userDetails,
  location,
  message
) => {
  const sosMessage = `🚨 EMERGENCY ALERT 🚨
${userDetails.name} has sent an SOS alert and needs immediate help!

📍 Location: ${
    location.address || `${location.latitude}, ${location.longitude}`
  }
📞 Contact: ${userDetails.phone}
💬 Message: ${message || "Emergency assistance needed"}

Please check on them immediately or contact emergency services.
Time: ${new Date().toLocaleString()}`;

  const emailHTML = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
        <h1>🚨 EMERGENCY ALERT 🚨</h1>
      </div>
      <div style="padding: 20px; background-color: #fef2f2; border: 2px solid #dc2626;">
        <h2>${userDetails.name} needs immediate help!</h2>
        <p><strong>📍 Location:</strong> ${
          location.address || `${location.latitude}, ${location.longitude}`
        }</p>
        <p><strong>📞 Contact:</strong> ${userDetails.phone}</p>
        <p><strong>💬 Message:</strong> ${
          message || "Emergency assistance needed"
        }</p>
        <p><strong>⏰ Time:</strong> ${new Date().toLocaleString()}</p>
        <div style="margin-top: 20px; padding: 15px; background-color: #fee2e2; border-left: 4px solid #dc2626;">
          <p><strong>What to do:</strong></p>
          <ul>
            <li>Contact ${userDetails.name} immediately</li>
            <li>If you cannot reach them, contact local emergency services</li>
            <li>Share their location with authorities if needed</li>
          </ul>
        </div>
      </div>
    </div>
  `;

  const results = {};

  // Send SMS
  if (contact.phone) {
    results.sms = await sendSMS(contact.phone, sosMessage);
  }

  // Send Email
  if (contact.email) {
    results.email = await sendEmail(
      contact.email,
      `🚨 EMERGENCY: ${userDetails.name} needs help!`,
      sosMessage,
      emailHTML
    );
  }

  return results;
};

export const sendCheckInNotification = async (
  contact,
  userDetails,
  status,
  location,
  message
) => {
  const statusMessages = {
    SAFE: "✅ I am safe and well",
    NEEDS_HELP: "⚠️ I need assistance",
    INJURED: "🚑 I am injured and need help",
    MISSING: "🆘 I am missing - please help",
  };

  const statusColors = {
    SAFE: "#16a34a",
    NEEDS_HELP: "#ca8a04",
    INJURED: "#dc2626",
    MISSING: "#7c2d12",
  };

  const checkInMessage = `Status Update from ${userDetails.name}

${statusMessages[status]}

${location && location.address ? `📍 Location: ${location.address}` : ""}
${message ? `💬 Message: ${message}` : ""}

Time: ${new Date().toLocaleString()}`;

  const emailHTML = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: ${
        statusColors[status]
      }; color: white; padding: 20px; text-align: center;">
        <h1>Status Update</h1>
      </div>
      <div style="padding: 20px;">
        <h2>${userDetails.name} has checked in</h2>
        <div style="padding: 15px; background-color: #f3f4f6; border-radius: 8px; margin: 15px 0;">
          <h3 style="color: ${statusColors[status]}; margin: 0;">${
    statusMessages[status]
  }</h3>
        </div>
        ${
          location && location.address
            ? `<p><strong>📍 Location:</strong> ${location.address}</p>`
            : ""
        }
        ${message ? `<p><strong>💬 Message:</strong> ${message}</p>` : ""}
        <p><strong>⏰ Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>📞 Contact:</strong> ${userDetails.phone}</p>
      </div>
    </div>
  `;

  const results = {};

  // Send SMS
  if (contact.phone) {
    results.sms = await sendSMS(contact.phone, checkInMessage);
  }

  // Send Email
  if (contact.email) {
    results.email = await sendEmail(
      contact.email,
      `Status Update: ${userDetails.name} - ${statusMessages[status]}`,
      checkInMessage,
      emailHTML
    );
  }

  return results;
};
