const axios = require("axios");
const config = require("../config");

async function getZoomAuthToken() {
  const auth = Buffer.from(
    `${config.zoom.clientId}:${config.zoom.clientSecret}`
  ).toString("base64");

  try {
    const response = await axios.post(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${config.zoom.accountId}`,
      {},
      {
        headers: { Authorization: `Basic ${auth}` },
        timeout: 8000,
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error("Zoom auth error:", error.response?.data || error.message);
    return null;
  }
}

const ZOOM_TIMEOUT = 8000;

const createScheduledZoomMeeting = async (startTime, duration) => {
  const doCreate = async () => {
    const accessToken = await getZoomAuthToken();
    if (!accessToken) return null;
    const response = await axios.post(
      `https://api.zoom.us/v2/users/me/meetings`,
      {
        topic: "Scheduled Meeting",
        type: 2,
        start_time: startTime,
        duration: duration,
        timezone: "Asia/Kolkata",
        agenda: "This is a scheduled meeting.",
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: true,
          mute_upon_entry: true,
          enforce_login: false,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        timeout: ZOOM_TIMEOUT,
      }
    );
    return response.data.join_url;
  };

  try {
    return await Promise.race([
      doCreate(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Zoom API timeout")), ZOOM_TIMEOUT)
      ),
    ]);
  } catch (error) {
    console.error(
      "Error creating Zoom meeting:",
      error.response?.data || error.message
    );
    return null;
  }
};

module.exports = {
  createScheduledZoomMeeting,
};
