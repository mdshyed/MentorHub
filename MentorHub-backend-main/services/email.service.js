const path = require("path");
const ejs = require("ejs");
const nodemailer = require("nodemailer");
const config = require("../config");

const isEmailConfigured = () => {
  const { host, port, auth, from } = config.email || {};
  const portValid = typeof port === "number" && port > 0;
  return !!(host && portValid && auth?.user && auth?.pass && from);
};

const transport = nodemailer.createTransport(config.email);

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
    const msg = { from: config.email.from, to, subject, html };
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
    return false;
  }
};

const sendConfirmationMail = async (to, name, meetingLink, date, time) => {
  const subject = "Booking Confirmation";

  const template = path.join(__dirname, "../template/confirmation.ejs");
  const data = await ejs.renderFile(template, {
    name,
    meetingLink,
    date,
    time,
  });

  return sendEmail(to, subject, data);
};

module.exports = {
  sendConfirmationMail,
};
