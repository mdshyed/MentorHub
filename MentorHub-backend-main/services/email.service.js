const path = require("path");
const ejs = require("ejs");
const nodemailer = require("nodemailer");
const config = require("../config");

const isEmailConfigured = () => {
  const { host, port, auth } = config.email || {};
  const portValid = typeof port === "number" && port > 0;
  const from = config.email?.from || config.email?.auth?.user;
  const ok = !!(host && portValid && auth?.user && auth?.pass && from);
  if (!ok) {
    const missing = [];
    if (!host) missing.push("SMTP_HOST");
    if (!portValid) missing.push("SMTP_PORT");
    if (!auth?.user) missing.push("SMTP_USERNAME");
    if (!auth?.pass) missing.push("SMTP_PASSWORD");
    if (!from) missing.push("EMAIL_FROM or SMTP_USERNAME");
    if (missing.length) console.warn("[Email] Not configured. Missing:", missing.join(", "));
  }
  return ok;
};

// Use service: 'gmail' for Gmail (more reliable than host/port)
const createTransport = () => {
  const { host, auth } = config.email || {};
  if (host && host.toLowerCase().includes("gmail")) {
    return nodemailer.createTransport({
      service: "gmail",
      pool: false,
      auth: { user: auth?.user, pass: auth?.pass },
    });
  }
  return nodemailer.createTransport(config.email);
};
const transport = createTransport();

transport
  .verify()
  .then(() => console.log("Connected to email server"))
  .catch((err) => {
    if (!isEmailConfigured()) {
      console.warn(
        "Email not configured: set SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, and EMAIL_FROM in .env to send confirmation emails."
      );
    } else {
      console.error("Unable to connect to email server:", err?.message || err);
    }
  });

const sendEmail = async (to, subject, html) => {
  if (!isEmailConfigured()) {
    console.warn(
      "Skipping email send: set SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, and EMAIL_FROM in .env"
    );
    return false;
  }
  if (!to || typeof to !== "string" || !to.includes("@")) {
    console.warn("Skipping email send: invalid recipient address.");
    return false;
  }
  try {
    // Gmail requires "from" to match auth user; fallback to SMTP_USERNAME
    const fromAddr = config.email.from || config.email.auth?.user;
    if (!fromAddr) {
      console.error("Email send failed: no from address (set EMAIL_FROM or SMTP_USERNAME)");
      return false;
    }
    const msg = { from: fromAddr, to, subject, html };
    await Promise.race([
      transport.sendMail(msg),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("SMTP send timeout (10s)")), 10000)
      ),
    ]);
    console.log("Email sent successfully to:", to);
    return true;
  } catch (error) {
    console.error("Error sending email:", error?.message || error);
    if (error?.response) console.error("SMTP response:", error.response);
    if (error?.code) console.error("Error code:", error.code);
    return false;
  }
};

const sendConfirmationMail = async (to, name, meetingLink, date, time) => {
  console.log("[Email] Attempting to send confirmation to:", to);
  if (!isEmailConfigured()) {
    console.warn("[Email] Skipped - SMTP not configured");
    return false;
  }
  const subject = "Booking Confirmation - MentorHub";
  const template = path.join(__dirname, "../template/confirmation.ejs");
  const data = await ejs.renderFile(template, {
    name: name || "User",
    meetingLink: meetingLink || "",
    date: date || "",
    time: time || "",
  });
  const sent = await sendEmail(to, subject, data);
  if (sent) console.log("[Email] Confirmation sent successfully to:", to);
  return sent;
};

module.exports = {
  sendConfirmationMail,
};
